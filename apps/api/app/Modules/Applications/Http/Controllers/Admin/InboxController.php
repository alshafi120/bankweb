<?php

namespace App\Modules\Applications\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Modules\Applications\Domain\Enums\ApplicationStatus;
use App\Modules\Applications\Http\Resources\InboxPresenter;
use App\Modules\Applications\Infrastructure\Models\Application;
use App\Modules\Applications\Infrastructure\Models\Complaint;
use App\Modules\Applications\Infrastructure\Models\ContactRequest;
use App\Modules\Applications\Infrastructure\Models\JobApplication;
use App\Modules\Audit\Application\Services\AuditLogger;
use App\Modules\Audit\Domain\Enums\AuditAction;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Support\Admin\ListQuery;
use App\Support\Http\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Inbox for public requests: applications · contact-requests · complaints · job-applications.
 * GET list/show · PATCH {status?, assignedTo?} · POST notes · GET export (CSV, masked, audited)
 * GET complaints/{id}/attachment · job-applications/{id}/cv → signed URL valid 5 minutes.
 */
class InboxController extends Controller
{
    public const KINDS = [
        'applications' => Application::class,
        'contact-requests' => ContactRequest::class,
        'complaints' => Complaint::class,
        'job-applications' => JobApplication::class,
    ];

    public function __construct(private readonly AuditLogger $audit) {}

    public function index(Request $request, string $kind): JsonResponse
    {
        $this->authorizeKind($request, $kind, 'view');
        $list = ListQuery::fromRequest($request);

        $query = $this->filtered($this->query($kind), $list, $kind);

        return ApiResponse::paginated($list->paginate($query), fn (Model $m) => InboxPresenter::present($m));
    }

    public function show(Request $request, string $kind, int $id): JsonResponse
    {
        $this->authorizeKind($request, $kind, 'view');

        return ApiResponse::data(InboxPresenter::present($this->find($kind, $id)));
    }

    public function update(Request $request, string $kind, int $id): JsonResponse
    {
        $this->authorizeKind($request, $kind, 'update');
        $data = $request->validate([
            'status' => ['sometimes', Rule::in(ApplicationStatus::values())],
            'assignedTo' => ['sometimes', 'nullable', 'integer', Rule::exists('users', 'id')->where('is_active', true)],
        ]);
        $record = $this->find($kind, $id);

        if (array_key_exists('status', $data)) {
            $record->setAttribute('status', $data['status']);
            if ($record instanceof Complaint) {
                $record->setAttribute('resolved_at', in_array($data['status'], ['approved', 'closed', 'rejected'], true) ? ($record->resolved_at ?? now()) : null);
            }
        }
        if (array_key_exists('assignedTo', $data)) {
            $record->setAttribute('assigned_to', $data['assignedTo']);
        }
        $record->save();

        return ApiResponse::data(InboxPresenter::present($this->find($kind, $id)));
    }

    public function addNote(Request $request, string $kind, int $id): JsonResponse
    {
        $this->authorizeKind($request, $kind, 'update');
        $data = $request->validate(['body' => ['required', 'string', 'min:1', 'max:5000']]);
        $record = $this->find($kind, $id);

        $record->notes()->create(['user_id' => $request->user()->id, 'body' => trim(strip_tags($data['body']))]);
        $this->audit->log(AuditAction::Update, $record, ['after' => ['note' => 'added']]);

        return ApiResponse::data(InboxPresenter::present($this->find($kind, $id)));
    }

    /** CSV with masked PII; requires `<kind>.export`; audited as `export`. */
    public function export(Request $request, string $kind): StreamedResponse
    {
        $this->authorizeKind($request, $kind, 'export');
        $list = ListQuery::fromRequest($request);
        $query = $this->filtered($this->query($kind), $list, $kind);
        $count = (clone $query)->count();

        $this->audit->log(AuditAction::Export, $kind, ['after' => ['rows' => $count, 'filters' => $list->filters, 'status' => $list->status, 'search' => $list->search !== null]]);

        $filename = $kind.'-'.now()->format('Ymd-His').'.csv';

        return response()->streamDownload(function () use ($query) {
            $out = fopen('php://output', 'wb');
            fwrite($out, "\xEF\xBB\xBF"); // UTF-8 BOM for Excel (Arabic)
            fputcsv($out, InboxPresenter::CSV_HEADER, ',', '"', '\\');
            $query->chunkById(500, function ($rows) use ($out) {
                foreach ($rows as $row) {
                    fputcsv($out, array_map([self::class, 'csvSafe'], InboxPresenter::csvRow($row)), ',', '"', '\\');
                }
            });
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8', 'Cache-Control' => 'no-store']);
    }

    public function attachment(Request $request, int $id): JsonResponse
    {
        return $this->fileLink($request, 'complaints', $id);
    }

    public function cv(Request $request, int $id): JsonResponse
    {
        return $this->fileLink($request, 'job-applications', $id);
    }

    /** Signed URL (5 min) to a private applicant file. */
    private function fileLink(Request $request, string $kind, int $id): JsonResponse
    {
        abort_unless(in_array($kind, ['complaints', 'job-applications'], true), 404);
        $this->authorizeKind($request, $kind, 'view');
        $record = $this->find($kind, $id);
        $file = $record instanceof Complaint ? $record->attachment_path : $record->cv_path;
        abort_if(blank($file) || ! Storage::disk('private')->exists($file), 404);

        $expires = now()->addMinutes((int) config('bank.signed_url_minutes', 5));
        // Relative signature: valid whether the admin reaches the API directly or through its
        // same-origin `/backend` rewrite (SIGNED_URL_BASE, e.g. https://admin.bank.ye/backend).
        $path = URL::temporarySignedRoute('admin.files.download', $expires, ['kind' => $kind, 'id' => $record->id, 'user' => $request->user()->id], absolute: false);
        $url = rtrim((string) (config('bank.signed_url_base') ?: config('app.url')), '/').$path;
        $this->audit->log(AuditAction::Export, $record, ['after' => ['file' => $kind === 'complaints' ? 'attachment' : 'cv']]);

        return ApiResponse::data([
            'url' => $url,
            'expiresAt' => $expires->toIso8601String(),
            'filename' => $record->reference.'.'.pathinfo($file, PATHINFO_EXTENSION),
        ]);
    }

    /** Target of the signed URL. Signature checked by middleware; must be the same signed-in admin. */
    public function download(Request $request, string $kind, int $id): \Symfony\Component\HttpFoundation\Response
    {
        abort_unless(in_array($kind, ['complaints', 'job-applications'], true), 404);
        abort_unless((int) $request->query('user') === (int) $request->user()?->id, 403, 'Forbidden.');
        $this->authorizeKind($request, $kind, 'view');
        $record = $this->find($kind, $id);
        $path = $record instanceof Complaint ? $record->attachment_path : $record->cv_path;
        abort_if(blank($path), 404);

        $mime = Storage::disk('private')->mimeType($path) ?: 'application/octet-stream';

        return Storage::disk('private')->download($path, $record->reference.'.'.pathinfo($path, PATHINFO_EXTENSION), [
            'Content-Type' => $mime,
            'Cache-Control' => 'no-store, private',
            'X-Content-Type-Options' => 'nosniff',
            'Content-Security-Policy' => "default-src 'none'; sandbox",
        ]);
    }

    private function authorizeKind(Request $request, string $kind, string $ability): void
    {
        abort_unless(isset(self::KINDS[$kind]), 404);
        abort_unless($request->user()->can($kind.'.'.$ability), 403, 'Forbidden.');
    }

    private function query(string $kind): Builder
    {
        $with = ['assignee', 'notes.user'];
        $with = match ($kind) {
            'applications' => [...$with, 'branch', 'financingRequest.product', 'cardRequest.card'],
            'complaints' => [...$with, 'branch'],
            'job-applications' => [...$with, 'job'],
            default => $with,
        };

        return (self::KINDS[$kind])::query()->with($with);
    }

    private function find(string $kind, int $id): Model
    {
        return $this->query($kind)->findOrFail($id);
    }

    private function filtered(Builder $query, ListQuery $list, string $kind): Builder
    {
        if ($list->search !== null) {
            $query->matchingPii($list->search);
        }
        $filters = [
            'assignedTo' => fn (Builder $q, $v) => $v === 'none' ? $q->whereNull('assigned_to') : $q->where('assigned_to', (int) $v),
            'from' => fn (Builder $q, $v) => $q->whereDate('created_at', '>=', $v),
            'to' => fn (Builder $q, $v) => $q->whereDate('created_at', '<=', $v),
            'locale' => 'locale',
        ];
        $filters += match ($kind) {
            'applications' => ['type' => 'type', 'city' => 'city', 'accountType' => 'account_type'],
            'complaints' => ['category' => 'category'],
            'contact-requests' => ['subject' => 'subject'],
            'job-applications' => ['jobId' => 'job_id', 'city' => 'city'],
            default => [],
        };

        return $list->apply($query, [], $filters, ['createdAt' => 'created_at', 'updatedAt' => 'updated_at', 'status' => 'status', 'id' => 'id'], '-createdAt');
    }

    /** Neutralise CSV/formula injection (=, +, -, @ at the start of a cell). */
    public static function csvSafe(mixed $value): string
    {
        $value = (string) $value;

        return preg_match('/^[=+\-@\t\r]/', $value) ? "'".$value : $value;
    }
}

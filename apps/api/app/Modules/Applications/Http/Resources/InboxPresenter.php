<?php

namespace App\Modules\Applications\Http\Resources;

use App\Modules\Applications\Infrastructure\Models\Application;
use App\Modules\Applications\Infrastructure\Models\ApplicationNote;
use App\Modules\Applications\Infrastructure\Models\Complaint;
use App\Modules\Applications\Infrastructure\Models\ContactRequest;
use App\Modules\Applications\Infrastructure\Models\JobApplication;
use App\Support\Security\Masker;
use Illuminate\Database\Eloquent\Model;

/**
 * Admin inbox record (`AdminApplication`, extended to contact/complaint/job as `InboxRecord`).
 * Personal data is ALWAYS masked (phoneMasked, nationalIdMasked); raw values never leave the API.
 */
final class InboxPresenter
{
    public static function present(Model $r): array
    {
        $type = match (true) {
            $r instanceof Application => $r->type,
            $r instanceof ContactRequest => 'contact',
            $r instanceof Complaint => 'complaint',
            $r instanceof JobApplication => 'job',
        };

        $nationalId = ($r instanceof Application || $r instanceof Complaint) ? $r->national_id : null;

        return [
            'id' => $r->id,
            'reference' => $r->reference,
            'type' => $type,
            'status' => $r->status,
            'fullName' => $r->full_name,
            'phoneMasked' => Masker::phone($r->phone),
            'nationalIdMasked' => Masker::nationalId($nationalId),
            'email' => $r->email,
            'city' => (string) ($r->city ?? ''),
            'locale' => $r->locale,
            'assignedTo' => $r->assignee ? ['id' => $r->assignee->id, 'name' => $r->assignee->name] : null,
            'details' => self::details($r),
            'notes' => $r->relationLoaded('notes') ? $r->notes->map(fn (ApplicationNote $n) => [
                'id' => $n->id,
                'body' => $n->body,
                'author' => $n->user?->name ?? '—',
                'createdAt' => $n->created_at?->toIso8601String(),
            ])->values()->all() : [],
            'createdAt' => $r->created_at?->toIso8601String(),
            'updatedAt' => $r->updated_at?->toIso8601String(),
        ];
    }

    private static function details(Model $r): array
    {
        return match (true) {
            $r instanceof Application => match ($r->type) {
                'account' => ['accountType' => $r->account_type, 'branchId' => $r->branch?->slug, 'branch' => $r->branch?->localized('name')],
                'financing' => [
                    'financingProductId' => $r->financingRequest?->product?->slug,
                    'financingProduct' => $r->financingRequest?->product?->localized('name'),
                    'amount' => $r->financingRequest?->amount,
                    'months' => $r->financingRequest?->months,
                    'monthlyIncome' => $r->financingRequest?->monthly_income,
                    'employer' => $r->financingRequest?->employer,
                    'notes' => $r->financingRequest?->notes,
                ],
                'card' => [
                    'cardId' => $r->cardRequest?->card?->slug,
                    'card' => $r->cardRequest?->card?->localized('name'),
                    'hasAccount' => (bool) $r->cardRequest?->has_account,
                    'accountLast4' => $r->cardRequest?->account_last4,
                ],
                default => [],
            },
            $r instanceof ContactRequest => ['subject' => $r->subject, 'message' => $r->message, 'preferredTime' => $r->preferred_time],
            $r instanceof Complaint => [
                'category' => $r->category,
                'branchId' => $r->branch?->slug,
                'transactionDate' => $r->transaction_date?->toDateString(),
                'description' => $r->description,
                'hasAttachment' => filled($r->attachment_path),
                'resolvedAt' => $r->resolved_at?->toIso8601String(),
            ],
            $r instanceof JobApplication => [
                'jobId' => $r->job_id,
                'job' => $r->job?->localized('title'),
                'education' => $r->education,
                'experienceYears' => $r->experience_years,
                'coverLetter' => $r->cover_letter,
                'hasCv' => filled($r->cv_path),
            ],
        };
    }

    /** Flat masked row for CSV export. */
    public static function csvRow(Model $r): array
    {
        $p = self::present($r);
        $d = $p['details'];

        return [
            $p['reference'], $p['type'], $p['status'], $p['fullName'], $p['phoneMasked'], $p['nationalIdMasked'],
            Masker::email($p['email']) ?? '', $p['city'], $p['locale'], $p['assignedTo']['name'] ?? '',
            json_encode(array_filter($d, fn ($v) => ! is_array($v)), JSON_UNESCAPED_UNICODE), $p['createdAt'],
        ];
    }

    public const CSV_HEADER = ['reference', 'type', 'status', 'fullName', 'phone', 'nationalId', 'email', 'city', 'locale', 'assignedTo', 'details', 'createdAt'];
}

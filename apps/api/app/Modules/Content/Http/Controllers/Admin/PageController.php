<?php

namespace App\Modules\Content\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Modules\Audit\Application\Services\AuditLogger;
use App\Modules\Audit\Domain\Enums\AuditAction;
use App\Modules\Content\Application\Services\BlockSchema;
use App\Modules\Content\Http\Resources\PageAdminResource;
use App\Modules\Content\Infrastructure\Models\Page;
use App\Modules\Content\Infrastructure\Models\PageSection;
use App\Support\Content\ContentCache;
use App\Support\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** PUT /pages/{id}/sections (full ordered replace) · POST /pages/{id}/publish · POST /pages/{id}/schedule */
class PageController extends Controller
{
    public function __construct(private readonly PageAdminResource $resource, private readonly AuditLogger $audit) {}

    public function sections(Request $request, int $id): JsonResponse
    {
        abort_unless($request->user()->can('pages.update'), 403, 'Forbidden.');
        $page = Page::query()->findOrFail($id);

        // Body is the bare array of sections (admin client) or { sections: [...] }.
        $payload = $request->json()->all();
        $sections = array_is_list($payload) ? $payload : ($payload['sections'] ?? null);
        if (! is_array($sections) || ! array_is_list($sections)) {
            throw ValidationException::withMessages(['sections' => ['An ordered array of sections is required.']]);
        }

        $validator = validator(['sections' => $sections], [
            'sections' => ['array', 'max:60'],
            'sections.*.id' => ['nullable', 'integer'],
            'sections.*.type' => ['required', 'string', Rule::in(BlockSchema::allTypes())],
            'sections.*.data' => ['present'],
            'sections.*.isVisible' => ['sometimes', 'boolean'],
            'sections.*.startsAt' => ['nullable', 'date'],
            'sections.*.endsAt' => ['nullable', 'date'],
        ]);
        $validator->validate();

        $normalized = [];
        foreach ($sections as $i => $section) {
            if (! empty($section['startsAt']) && ! empty($section['endsAt']) && Carbon::parse($section['endsAt'])->lt(Carbon::parse($section['startsAt']))) {
                throw ValidationException::withMessages(["sections.{$i}.endsAt" => ['The end must be after the start.']]);
            }
            if ($page->template !== 'home' && str_starts_with($section['type'], 'home:')) {
                throw ValidationException::withMessages(["sections.{$i}.type" => ['Home blocks are only allowed on the home page.']]);
            }
            $normalized[] = [
                'id' => isset($section['id']) && is_int($section['id']) ? $section['id'] : null,
                'type' => $section['type'],
                'data' => BlockSchema::normalize($section['type'], $section['data'], "sections.{$i}.data"),
                'is_visible' => (bool) ($section['isVisible'] ?? true),
                'starts_at' => $section['startsAt'] ?? null,
                'ends_at' => $section['endsAt'] ?? null,
                'position' => $i + 1,
            ];
        }

        $before = $page->sections()->get(['id', 'type', 'position', 'is_visible'])->toArray();

        ContentCache::muted(function () use ($page, $normalized) {
            DB::transaction(function () use ($page, $normalized) {
                $keep = [];
                foreach ($normalized as $row) {
                    $existing = $row['id'] ? $page->sections()->whereKey($row['id'])->first() : null;
                    $section = $existing ?? new PageSection(['page_id' => $page->id]);
                    $section->fill([
                        'page_id' => $page->id,
                        'type' => $row['type'],
                        'data' => $row['data'],
                        'is_visible' => $row['is_visible'],
                        'starts_at' => $row['starts_at'],
                        'ends_at' => $row['ends_at'],
                        'position' => $row['position'],
                    ])->save();
                    $keep[] = $section->id;
                }
                $page->sections()->whereNotIn('id', $keep)->delete();
                $page->touch();
            });
        });
        ContentCache::changed($page->revalidationTags(), $page->revalidationPaths());

        $this->audit->log(AuditAction::Update, $page, [
            'before' => ['sections' => $before],
            'after' => ['sections' => array_map(fn ($r) => ['type' => $r['type'], 'position' => $r['position'], 'is_visible' => $r['is_visible']], $normalized)],
        ]);

        return $this->respond($page);
    }

    public function publish(Request $request, int $id): JsonResponse
    {
        abort_unless($request->user()->can('pages.publish'), 403, 'Forbidden.');
        $page = Page::query()->findOrFail($id);
        $this->requireComplete($page);

        $page->forceFill(['status' => 'published', 'published_at' => $page->published_at ?? now(), 'publish_at' => null])->save();
        $this->audit->log(AuditAction::Publish, $page);

        return $this->respond($page);
    }

    public function schedule(Request $request, int $id): JsonResponse
    {
        abort_unless($request->user()->can('pages.publish'), 403, 'Forbidden.');
        $data = $request->validate(['publishAt' => ['required', 'date', 'after:now']]);
        $page = Page::query()->findOrFail($id);
        $this->requireComplete($page);

        $page->forceFill(['status' => 'scheduled', 'publish_at' => Carbon::parse($data['publishAt'])])->save();
        $this->audit->log(AuditAction::Publish, $page, ['after' => ['scheduledFor' => $page->publish_at?->toIso8601String()]]);

        return $this->respond($page);
    }

    private function requireComplete(Page $page): void
    {
        if (blank($page->title_ar) || blank($page->title_en)) {
            throw ValidationException::withMessages(['title' => ['Both Arabic and English titles are required before publishing.']]);
        }
    }

    private function respond(Page $page): JsonResponse
    {
        return ApiResponse::data($this->resource->present($page->refresh()->load($this->resource->with())));
    }
}

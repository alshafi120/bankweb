<?php

namespace App\Modules\Content\Http\Resources;

use App\Modules\Content\Infrastructure\Models\Page;
use App\Modules\Content\Infrastructure\Models\PageSection;
use App\Modules\News\Domain\Enums\ContentStatus;
use App\Support\Admin\AdminResource;
use App\Support\Admin\Field;
use Illuminate\Database\Eloquent\Model;

/** `AdminPage` (apps/admin/src/types/admin.ts). Sections are replaced through PUT /pages/{id}/sections. */
class PageAdminResource extends AdminResource
{
    public function key(): string
    {
        return 'pages';
    }

    public function model(): string
    {
        return Page::class;
    }

    public function statuses(): array
    {
        return ContentStatus::values();
    }

    public function with(): array
    {
        return ['sections', 'seo.ogImage'];
    }

    public function fields(): array
    {
        return [
            'slug' => Field::slug(),
            'title' => Field::localized('title', true),
            'summary' => Field::localized('summary', false, 1000),
            'template' => Field::enum('template', ['default', 'home'], false),
            'publishAt' => Field::datetime('publish_at')->readOnly(),
            'publishedAt' => Field::datetime('published_at')->readOnly(),
        ];
    }

    public function searchable(): array
    {
        return ['title_ar', 'title_en', 'slug'];
    }

    public function filters(): array
    {
        return ['template' => 'template'];
    }

    public function defaultSort(): string
    {
        return '-updatedAt';
    }

    public function fill(Model $model, array $data, \App\Modules\Identity\Infrastructure\Models\User $user, bool $creating): void
    {
        parent::fill($model, $data, $user, $creating);
        if ($model->getAttribute('status') === 'published' && $model->getAttribute('published_at') === null) {
            $model->setAttribute('published_at', now());
        }
        if ($model->isDirty('status') && $model->getAttribute('status') !== 'scheduled') {
            $model->setAttribute('publish_at', null);
        }
    }

    public function deleteBlockedReason(Model $model, $user): ?string
    {
        return $model->slug === 'home' ? 'The home page cannot be deleted.' : null;
    }

    protected function extend(Model $model, array $out): array
    {
        $out['sections'] = $model->sections->map(fn (PageSection $s) => self::section($s))->values()->all();

        return $out;
    }

    public static function section(PageSection $s): array
    {
        return [
            'id' => $s->id,
            'type' => $s->type,
            'data' => $s->data === [] || $s->data === null ? (object) [] : $s->data,
            'isVisible' => (bool) $s->is_visible,
            'startsAt' => $s->starts_at?->toIso8601String(),
            'endsAt' => $s->ends_at?->toIso8601String(),
        ];
    }
}

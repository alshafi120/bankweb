<?php

namespace App\Modules\News\Http\Resources;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\News\Domain\Enums\ContentStatus;
use App\Modules\News\Infrastructure\Models\News;
use App\Support\Admin\AdminResource;
use App\Support\Admin\Field;
use Illuminate\Database\Eloquent\Model;

/**
 * `AdminNews`. Status is NOT writable through CRUD: it only moves through the workflow endpoints
 * (submit / approve / reject / publish / schedule) so Maker/Checker cannot be bypassed.
 */
class NewsAdminResource extends AdminResource
{
    public function key(): string
    {
        return 'news';
    }

    public function model(): string
    {
        return News::class;
    }

    public function statuses(): array
    {
        return ContentStatus::values();
    }

    public function with(): array
    {
        return ['category', 'featuredMedia', 'author', 'reviewer', 'seo.ogImage'];
    }

    public function fields(): array
    {
        return [
            'slug' => Field::slug(),
            'categoryId' => Field::fk('news_category_id', 'news_categories'),
            'title' => Field::localized('title', true),
            'excerpt' => Field::localized('excerpt', false, 1000),
            'content' => Field::html('content'),
            'featuredMedia' => Field::media('featured_media_id'),
        ];
    }

    public function rules(bool $creating, ?Model $model): array
    {
        $rules = parent::rules($creating, $model);
        unset($rules['status']);

        return $rules;
    }

    public function fill(Model $model, array $data, User $user, bool $creating): void
    {
        unset($data['status']);
        parent::fill($model, $data, $user, $creating);
        if ($creating) {
            $model->setAttribute('author_id', $user->id);
            $model->setAttribute('status', ContentStatus::Draft->value);
        }
        // Editing approved/published content sends it back to review (four-eyes on every change).
        if (! $creating && in_array($model->getOriginal('status'), ['approved', 'scheduled'], true) && $model->isDirty(['title_ar', 'title_en', 'content_ar', 'content_en', 'excerpt_ar', 'excerpt_en'])) {
            $model->setAttribute('status', ContentStatus::PendingReview->value);
            $model->setAttribute('publish_at', null);
        }
    }

    public function searchable(): array
    {
        return ['title_ar', 'title_en', 'slug'];
    }

    public function filters(): array
    {
        return ['categoryId' => 'news_category_id', 'authorId' => 'author_id'];
    }

    public function sorts(): array
    {
        return parent::sorts() + ['publishedAt' => 'published_at', 'title' => 'title_ar'];
    }

    public function bulkStatus(string $action): ?string
    {
        // Bulk publish would bypass review; only archive/unpublish are allowed in bulk.
        return match ($action) {
            'archive' => 'archived',
            'unpublish' => 'draft',
            default => null,
        };
    }

    protected function extend(Model $model, array $out): array
    {
        /** @var News $model */
        $out['author'] = $model->author ? ['id' => $model->author->id, 'name' => $model->author->name] : null;
        $out['reviewedBy'] = $model->reviewer ? ['id' => $model->reviewer->id, 'name' => $model->reviewer->name] : null;
        $out['reviewedAt'] = $model->reviewed_at?->toIso8601String();
        $out['reviewNote'] = $model->review_note;
        $out['publishAt'] = $model->publish_at?->toIso8601String();
        $out['publishedAt'] = $model->published_at?->toIso8601String();
        $out['seo'] = $model->seoPayload($model->localized('title'), $model->localized('excerpt'));

        return $out;
    }
}

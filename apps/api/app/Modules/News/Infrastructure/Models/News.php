<?php

namespace App\Modules\News\Infrastructure\Models;

use App\Modules\Audit\Infrastructure\Concerns\Auditable;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Media\Infrastructure\Models\Media;
use App\Support\Casts\SanitizedHtml;
use App\Support\Concerns\HasLocalizedAttributes;
use App\Support\Concerns\HasSeo;
use App\Support\Concerns\HasStatus;
use App\Support\Concerns\Sluggable;
use App\Support\Concerns\TracksAuthors;
use App\Support\Content\InvalidatesContentCache;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $status
 * @property ?int $author_id
 */
class News extends Model
{
    use Auditable, HasFactory, HasLocalizedAttributes, HasSeo, HasStatus, InvalidatesContentCache, Sluggable, SoftDeletes, TracksAuthors;

    protected $table = 'news';

    protected $fillable = [
        'slug', 'news_category_id', 'title_ar', 'title_en', 'excerpt_ar', 'excerpt_en', 'content_ar', 'content_en',
        'featured_media_id', 'image_url', 'author_name',
    ];

    protected function casts(): array
    {
        return [
            'publish_at' => 'datetime',
            'published_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'content_ar' => SanitizedHtml::class,
            'content_en' => SanitizedHtml::class,
        ];
    }

    protected static function newFactory(): \Database\Factories\NewsFactory
    {
        return \Database\Factories\NewsFactory::new();
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(NewsCategory::class, 'news_category_id');
    }

    public function featuredMedia(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'featured_media_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function imageUrl(): string
    {
        return $this->featuredMedia?->url() ?? (string) $this->image_url;
    }

    public function revalidationTags(): array
    {
        return ['news', 'news:'.$this->slug, 'home', 'sitemap'];
    }

    public function revalidationPaths(): array
    {
        return ['/news', '/news/'.$this->slug];
    }
}

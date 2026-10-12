<?php

namespace App\Modules\Content\Infrastructure\Models;

use App\Modules\Audit\Infrastructure\Concerns\Auditable;
use App\Modules\Media\Infrastructure\Models\Media;
use App\Support\Concerns\HasLocalizedAttributes;
use App\Support\Content\InvalidatesContentCache;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class SeoMetadata extends Model
{
    use Auditable, HasLocalizedAttributes, InvalidatesContentCache;

    protected $table = 'seo_metadata';

    protected $fillable = [
        'seoable_type', 'seoable_id', 'path', 'title_ar', 'title_en', 'description_ar', 'description_en',
        'keywords_ar', 'keywords_en', 'canonical', 'og_media_id', 'noindex',
    ];

    protected function casts(): array
    {
        return ['noindex' => 'boolean'];
    }

    public function seoable(): MorphTo
    {
        return $this->morphTo();
    }

    public function ogImage(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'og_media_id');
    }

    /** Contract `Seo`; empty fields fall back to the entity's title/summary. */
    public function toContract(array $fallbackTitle = ['ar' => '', 'en' => ''], array $fallbackDescription = ['ar' => '', 'en' => '']): array
    {
        $pick = fn (array $own, array $fallback) => [
            'ar' => $own['ar'] !== '' ? $own['ar'] : (string) ($fallback['ar'] ?? ''),
            'en' => $own['en'] !== '' ? $own['en'] : (string) ($fallback['en'] ?? ''),
        ];

        return [
            'title' => $pick($this->localized('title'), $fallbackTitle),
            'description' => $pick($this->localized('description'), $fallbackDescription),
            'keywords' => $this->localized('keywords'),
            'canonical' => $this->canonical,
            'ogImage' => $this->ogImage?->toRef(),
            'noindex' => (bool) $this->noindex,
        ];
    }

    public function auditResourceType(): string
    {
        return 'seo';
    }

    public function auditLabel(): ?string
    {
        return $this->path ?? $this->title_ar;
    }

    public function revalidationTags(): array
    {
        return ['home', 'pages', 'news', 'sitemap'];
    }

    public function revalidationPaths(): array
    {
        return $this->path ? [$this->path] : [];
    }
}

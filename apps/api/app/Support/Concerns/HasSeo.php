<?php

namespace App\Support\Concerns;

use App\Modules\Content\Infrastructure\Models\SeoMetadata;
use App\Modules\Media\Infrastructure\Models\Media;
use Illuminate\Database\Eloquent\Relations\MorphOne;

/** Polymorphic SEO metadata (`seo_metadata.seoable_*`) → contract type `Seo`. */
trait HasSeo
{
    public function seo(): MorphOne
    {
        return $this->morphOne(SeoMetadata::class, 'seoable');
    }

    /**
     * @param  array{ar: string, en: string}  $fallbackTitle
     * @param  array{ar: string, en: string}  $fallbackDescription
     */
    public function seoPayload(array $fallbackTitle, array $fallbackDescription): array
    {
        /** @var SeoMetadata|null $seo */
        $seo = $this->relationLoaded('seo') ? $this->getRelation('seo') : $this->seo()->first();

        return $seo ? $seo->toContract($fallbackTitle, $fallbackDescription) : [
            'title' => $fallbackTitle,
            'description' => $fallbackDescription,
            'keywords' => ['ar' => '', 'en' => ''],
            'canonical' => null,
            'ogImage' => null,
            'noindex' => false,
        ];
    }

    /** Upsert SEO from an admin `Seo` payload (camelCase). */
    public function syncSeo(?array $seo): void
    {
        if ($seo === null) {
            return;
        }

        $ogId = $seo['ogImage']['id'] ?? ($seo['ogImageId'] ?? null);

        $this->seo()->updateOrCreate([], [
            'title_ar' => $seo['title']['ar'] ?? null,
            'title_en' => $seo['title']['en'] ?? null,
            'description_ar' => $seo['description']['ar'] ?? null,
            'description_en' => $seo['description']['en'] ?? null,
            'keywords_ar' => $seo['keywords']['ar'] ?? null,
            'keywords_en' => $seo['keywords']['en'] ?? null,
            'canonical' => $seo['canonical'] ?? null,
            'og_media_id' => $ogId && Media::query()->whereKey($ogId)->exists() ? (int) $ogId : null,
            'noindex' => (bool) ($seo['noindex'] ?? false),
        ]);
        $this->unsetRelation('seo');
    }
}

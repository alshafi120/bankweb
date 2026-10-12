<?php

namespace App\Modules\Content\Http\Resources;

use App\Modules\Content\Infrastructure\Models\Banner;
use App\Support\Admin\AdminResource;
use App\Support\Admin\Field;

class BannerAdminResource extends AdminResource
{
    public function key(): string
    {
        return 'banners';
    }

    public function model(): string
    {
        return Banner::class;
    }

    public function fields(): array
    {
        return [
            'title' => Field::localized('title', true),
            'subtitle' => Field::localized('subtitle'),
            'media' => Field::media('media_id'),
            'ctaLabel' => Field::localized('cta_label', false, 120),
            'ctaHref' => Field::url('cta_href'),
            'placement' => Field::enum('placement', ['home_hero', 'home_strip', 'financing_page', 'cards_page', 'offers_page', 'global']),
            'startsAt' => Field::date('starts_at'),
            'endsAt' => Field::date('ends_at'),
        ];
    }

    public function searchable(): array
    {
        return ['title_ar', 'title_en'];
    }

    public function filters(): array
    {
        return ['placement' => 'placement'];
    }
}

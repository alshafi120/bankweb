<?php

namespace App\Modules\Catalog\Http\Resources;

use App\Modules\Catalog\Infrastructure\Models\Offer;
use App\Support\Admin\AdminResource;
use App\Support\Admin\Field;
use Illuminate\Database\Eloquent\Model;

class OfferAdminResource extends AdminResource
{
    public function key(): string
    {
        return 'offers';
    }

    public function model(): string
    {
        return Offer::class;
    }

    public function with(): array
    {
        return ['media'];
    }

    public function fields(): array
    {
        return [
            'slug' => Field::slug(),
            'title' => Field::localized('title', true),
            'details' => Field::localized('details', false, 1000),
            'media' => Field::media('media_id'),
            'href' => Field::url('href'),
            'startsAt' => Field::date('starts_at', true),
            'endsAt' => Field::date('ends_at', true),
        ];
    }

    public function extraRules(bool $creating, ?Model $model): array
    {
        return ['endsAt' => [$creating ? 'required' : 'sometimes', 'date_format:Y-m-d', 'after_or_equal:startsAt']];
    }

    public function searchable(): array
    {
        return ['title_ar', 'title_en', 'slug'];
    }

    protected function extend(Model $model, array $out): array
    {
        $out['image'] = $model->imageUrl();

        return $out;
    }
}

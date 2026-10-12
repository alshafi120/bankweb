<?php

namespace App\Modules\Catalog\Http\Resources;

use App\Modules\Catalog\Infrastructure\Models\Card;
use App\Support\Admin\AdminResource;
use App\Support\Admin\Field;

class CardAdminResource extends AdminResource
{
    public function key(): string
    {
        return 'cards';
    }

    public function model(): string
    {
        return Card::class;
    }

    public function fields(): array
    {
        return [
            'slug' => Field::slug(),
            'name' => Field::localized('name', true),
            'summary' => Field::localized('summary', false, 1000),
            'network' => Field::enum('network', ['Visa', 'Mastercard', 'Local']),
            'tone' => Field::enum('tone', ['jade', 'saffron', 'lapis', 'graphite']),
            'features' => Field::list('features'),
            'fees' => Field::localized('fees', false, 1000),
        ];
    }

    public function searchable(): array
    {
        return ['name_ar', 'name_en', 'slug'];
    }

    public function filters(): array
    {
        return ['network' => 'network'];
    }
}

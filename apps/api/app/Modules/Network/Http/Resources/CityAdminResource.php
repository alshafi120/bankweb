<?php

namespace App\Modules\Network\Http\Resources;

use App\Modules\Network\Infrastructure\Models\City;
use App\Support\Admin\AdminResource;
use App\Support\Admin\Field;

/** CMS-managed list of Yemeni cities (forms, network, jobs). Permission: branches.*. */
class CityAdminResource extends AdminResource
{
    public function key(): string
    {
        return 'cities';
    }

    public function permissionResource(): string
    {
        return 'branches';
    }

    public function model(): string
    {
        return City::class;
    }

    public function statuses(): array
    {
        return [];
    }

    public function fields(): array
    {
        return [
            'slug' => Field::slug(),
            'name' => Field::localized('name', true, 120),
            'governorate' => Field::localized('governorate', false, 120),
            'lat' => Field::decimal('lat', false, -90, 90),
            'lng' => Field::decimal('lng', false, -180, 180),
        ];
    }

    public function defaultSort(): string
    {
        return 'id';
    }

    public function searchable(): array
    {
        return ['name_ar', 'name_en', 'slug'];
    }
}

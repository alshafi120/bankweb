<?php

namespace App\Modules\Network\Http\Resources;

use App\Support\Admin\AdminResource;
use App\Support\Admin\Field;
use Illuminate\Database\Eloquent\Model;

/** Shared definition for branches / ATMs / agents (contract-like `AdminLocation`). */
abstract class LocationAdminResource extends AdminResource
{
    /** @return array<string, Field> */
    abstract protected function specificFields(): array;

    public function with(): array
    {
        return ['city'];
    }

    public function fields(): array
    {
        return [
            'slug' => Field::slug(),
            'cityId' => Field::fk('city_id', 'cities', true),
            'name' => Field::localized('name', true),
            'district' => Field::localized('district', false, 120),
            'address' => Field::localized('address'),
            'phone' => Field::string('phone', false, 40),
            'hours' => Field::localized('hours', false, 120),
            'services' => Field::list('services'),
            'lat' => Field::decimal('lat', true, -90, 90),
            'lng' => Field::decimal('lng', true, -180, 180),
            ...$this->specificFields(),
        ];
    }

    public function searchable(): array
    {
        return ['name_ar', 'name_en', 'district_ar', 'district_en', 'slug'];
    }

    public function filters(): array
    {
        return ['cityId' => 'city_id', 'city' => fn ($q, $v) => $q->whereHas('city', fn ($c) => $c->where('slug', $v))];
    }

    public function sorts(): array
    {
        return parent::sorts() + ['name' => 'name_en', 'cityId' => 'city_id', 'status' => 'status'];
    }

    protected function extend(Model $model, array $out): array
    {
        $out['type'] = $model::SERVICE_TYPE;
        $out['city'] = $model->city?->localized('name');

        return $out;
    }
}

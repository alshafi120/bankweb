<?php

namespace App\Modules\Network\Infrastructure\Concerns;

use App\Modules\Network\Infrastructure\Models\City;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Shared by branches, ATMs and agents → contract `Location`. */
trait IsLocation
{
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    public function toLocation(): array
    {
        return [
            'id' => $this->slug,
            'type' => static::SERVICE_TYPE,
            'name' => $this->localized('name'),
            'city' => $this->city ? $this->city->localized('name') : ['ar' => '', 'en' => ''],
            'district' => $this->localized('district'),
            'address' => $this->localized('address'),
            'phone' => (string) $this->phone,
            'hours' => $this->localized('hours'),
            'services' => $this->localizedList('services'),
            'lat' => (float) $this->lat,
            'lng' => (float) $this->lng,
        ];
    }

    public function revalidationTags(): array
    {
        return ['network', 'home'];
    }

    /** @return array<string, string> */
    protected function locationCasts(): array
    {
        return [
            'services_ar' => 'array', 'services_en' => 'array', 'lat' => 'float', 'lng' => 'float', 'position' => 'integer',
        ];
    }
}

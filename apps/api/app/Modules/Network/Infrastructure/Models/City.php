<?php

namespace App\Modules\Network\Infrastructure\Models;

use App\Modules\Audit\Infrastructure\Concerns\Auditable;
use App\Support\Concerns\HasLocalizedAttributes;
use App\Support\Concerns\Sluggable;
use App\Support\Content\InvalidatesContentCache;
use Illuminate\Database\Eloquent\Model;

class City extends Model
{
    use Auditable, HasLocalizedAttributes, InvalidatesContentCache, Sluggable;

    protected $fillable = ['slug', 'name_ar', 'name_en', 'governorate_ar', 'governorate_en', 'lat', 'lng'];

    protected function casts(): array
    {
        return ['lat' => 'float', 'lng' => 'float'];
    }

    public function revalidationTags(): array
    {
        return ['network', 'jobs'];
    }
}

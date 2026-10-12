<?php

namespace App\Modules\Network\Infrastructure\Models;

use App\Modules\Audit\Infrastructure\Concerns\Auditable;
use App\Modules\Network\Infrastructure\Concerns\IsLocation;
use App\Support\Concerns\HasLocalizedAttributes;
use App\Support\Concerns\HasPosition;
use App\Support\Concerns\HasStatus;
use App\Support\Concerns\Sluggable;
use App\Support\Concerns\TracksAuthors;
use App\Support\Content\InvalidatesContentCache;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Agent extends Model
{
    use Auditable, HasLocalizedAttributes, HasPosition, HasStatus, InvalidatesContentCache, IsLocation, Sluggable, SoftDeletes, TracksAuthors {
        IsLocation::revalidationTags insteadof InvalidatesContentCache;
    }

    public const SERVICE_TYPE = 'agent';

    protected $table = 'agents';

    protected $fillable = [
        'slug', 'city_id', 'name_ar', 'name_en', 'district_ar', 'district_en', 'address_ar', 'address_en', 'phone',
        'hours_ar', 'hours_en', 'services_ar', 'services_en', 'lat', 'lng', 'agent_code', 'position', 'status',
    ];

    protected function casts(): array
    {
        return $this->locationCasts();
    }
}

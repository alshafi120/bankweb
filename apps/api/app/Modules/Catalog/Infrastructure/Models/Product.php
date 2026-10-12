<?php

namespace App\Modules\Catalog\Infrastructure\Models;

use App\Modules\Audit\Infrastructure\Concerns\Auditable;
use App\Support\Concerns\HasLocalizedAttributes;
use App\Support\Concerns\HasPosition;
use App\Support\Concerns\HasSeo;
use App\Support\Concerns\HasStatus;
use App\Support\Concerns\Sluggable;
use App\Support\Concerns\TracksAuthors;
use App\Support\Content\InvalidatesContentCache;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/** Account products (contract `AccountProduct`). */
class Product extends Model
{
    use Auditable, HasLocalizedAttributes, HasPosition, HasSeo, HasStatus, InvalidatesContentCache, Sluggable, SoftDeletes, TracksAuthors;

    protected $fillable = [
        'slug', 'account_type', 'name_ar', 'name_en', 'tagline_ar', 'tagline_en', 'features_ar', 'features_en',
        'requirements_ar', 'requirements_en', 'minimum_balance', 'currency', 'position', 'status',
    ];

    protected function casts(): array
    {
        return [
            'features_ar' => 'array', 'features_en' => 'array', 'requirements_ar' => 'array', 'requirements_en' => 'array',
            'minimum_balance' => 'integer', 'position' => 'integer',
        ];
    }

    public function revalidationTags(): array
    {
        return ['products', 'home'];
    }

    public function revalidationPaths(): array
    {
        return ['/accounts/'.$this->slug];
    }
}

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

class Card extends Model
{
    use Auditable, HasLocalizedAttributes, HasPosition, HasSeo, HasStatus, InvalidatesContentCache, Sluggable, SoftDeletes, TracksAuthors;

    protected $fillable = [
        'slug', 'name_ar', 'name_en', 'summary_ar', 'summary_en', 'network', 'tone', 'features_ar', 'features_en',
        'fees_ar', 'fees_en', 'position', 'status',
    ];

    protected function casts(): array
    {
        return ['features_ar' => 'array', 'features_en' => 'array', 'position' => 'integer'];
    }

    public function revalidationTags(): array
    {
        return ['cards', 'card:'.$this->slug, 'home'];
    }
}

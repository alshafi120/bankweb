<?php

namespace App\Modules\Catalog\Infrastructure\Models;

use App\Modules\Audit\Infrastructure\Concerns\Auditable;
use App\Support\Casts\SanitizedHtml;
use App\Support\Concerns\HasLocalizedAttributes;
use App\Support\Concerns\HasPosition;
use App\Support\Concerns\HasSeo;
use App\Support\Concerns\HasStatus;
use App\Support\Concerns\Sluggable;
use App\Support\Concerns\TracksAuthors;
use App\Support\Content\InvalidatesContentCache;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Service extends Model
{
    use Auditable, HasLocalizedAttributes, HasPosition, HasSeo, HasStatus, InvalidatesContentCache, Sluggable, SoftDeletes, TracksAuthors;

    protected $fillable = ['slug', 'icon', 'title_ar', 'title_en', 'summary_ar', 'summary_en', 'body_ar', 'body_en', 'href', 'position', 'status'];

    protected function casts(): array
    {
        return ['position' => 'integer', 'body_ar' => SanitizedHtml::class, 'body_en' => SanitizedHtml::class];
    }

    public function revalidationTags(): array
    {
        return ['services', 'home'];
    }
}

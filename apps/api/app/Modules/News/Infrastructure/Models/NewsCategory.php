<?php

namespace App\Modules\News\Infrastructure\Models;

use App\Modules\Audit\Infrastructure\Concerns\Auditable;
use App\Support\Concerns\HasLocalizedAttributes;
use App\Support\Concerns\HasPosition;
use App\Support\Concerns\Sluggable;
use App\Support\Content\InvalidatesContentCache;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NewsCategory extends Model
{
    use Auditable, HasLocalizedAttributes, HasPosition, InvalidatesContentCache, Sluggable;

    protected $fillable = ['slug', 'name_ar', 'name_en', 'position'];

    public function news(): HasMany
    {
        return $this->hasMany(News::class);
    }

    public function auditResourceType(): string
    {
        return 'news-categories';
    }

    public function revalidationTags(): array
    {
        return ['news'];
    }
}

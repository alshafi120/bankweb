<?php

namespace App\Modules\Content\Infrastructure\Models;

use App\Modules\Audit\Infrastructure\Concerns\Auditable;
use App\Support\Concerns\HasLocalizedAttributes;
use App\Support\Concerns\HasPosition;
use App\Support\Concerns\Sluggable;
use App\Support\Content\InvalidatesContentCache;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FaqCategory extends Model
{
    use Auditable, HasLocalizedAttributes, HasPosition, InvalidatesContentCache, Sluggable;

    protected $fillable = ['slug', 'name_ar', 'name_en', 'position'];

    public function faqs(): HasMany
    {
        return $this->hasMany(Faq::class);
    }

    public function auditResourceType(): string
    {
        return 'faq-categories';
    }

    public function revalidationTags(): array
    {
        return ['faqs'];
    }
}

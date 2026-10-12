<?php

namespace App\Modules\Careers\Infrastructure\Models;

use App\Modules\Audit\Infrastructure\Concerns\Auditable;
use App\Modules\Network\Infrastructure\Models\City;
use App\Support\Casts\SanitizedHtml;
use App\Support\Concerns\HasLocalizedAttributes;
use App\Support\Concerns\HasPosition;
use App\Support\Concerns\HasSeo;
use App\Support\Concerns\HasStatus;
use App\Support\Concerns\Sluggable;
use App\Support\Concerns\TracksAuthors;
use App\Support\Content\InvalidatesContentCache;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/** Vacancy (careers). Status: active | inactive | closed. */
class Job extends Model
{
    use Auditable, HasFactory, HasLocalizedAttributes, HasPosition, HasSeo, HasStatus, InvalidatesContentCache, Sluggable, SoftDeletes, TracksAuthors;

    protected $table = 'jobs';

    protected $fillable = [
        'slug', 'title_ar', 'title_en', 'department_ar', 'department_en', 'city_id', 'employment_type', 'summary_ar',
        'summary_en', 'description_ar', 'description_en', 'requirements_ar', 'requirements_en', 'closes_at', 'position', 'status',
    ];

    protected function casts(): array
    {
        return [
            'requirements_ar' => 'array', 'requirements_en' => 'array', 'closes_at' => 'date', 'position' => 'integer',
            'description_ar' => SanitizedHtml::class, 'description_en' => SanitizedHtml::class,
        ];
    }

    protected static function newFactory(): \Database\Factories\JobFactory
    {
        return \Database\Factories\JobFactory::new();
    }

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(\App\Modules\Applications\Infrastructure\Models\JobApplication::class);
    }

    /** Open = active and not past its closing date. */
    public function scopeOpen(Builder $query): Builder
    {
        return $query->active()->where(fn (Builder $q) => $q->whereNull('closes_at')->orWhereDate('closes_at', '>=', now()->toDateString()));
    }

    public function isOpen(): bool
    {
        return $this->status === 'active' && ($this->closes_at === null || $this->closes_at->endOfDay()->isFuture());
    }

    public function revalidationTags(): array
    {
        return ['jobs', 'job:'.$this->slug, 'sitemap'];
    }
}

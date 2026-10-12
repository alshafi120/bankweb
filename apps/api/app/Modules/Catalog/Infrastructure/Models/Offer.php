<?php

namespace App\Modules\Catalog\Infrastructure\Models;

use App\Modules\Audit\Infrastructure\Concerns\Auditable;
use App\Modules\Media\Infrastructure\Models\Media;
use App\Support\Concerns\HasLocalizedAttributes;
use App\Support\Concerns\HasPosition;
use App\Support\Concerns\HasStatus;
use App\Support\Concerns\Sluggable;
use App\Support\Concerns\TracksAuthors;
use App\Support\Content\InvalidatesContentCache;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Offer extends Model
{
    use Auditable, HasLocalizedAttributes, HasPosition, HasStatus, InvalidatesContentCache, Sluggable, SoftDeletes, TracksAuthors;

    protected $fillable = [
        'slug', 'title_ar', 'title_en', 'details_ar', 'details_en', 'media_id', 'image_url', 'href', 'starts_at', 'ends_at', 'position', 'status',
    ];

    protected function casts(): array
    {
        return ['starts_at' => 'date', 'ends_at' => 'date', 'position' => 'integer'];
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class);
    }

    /** Active = status active and startsAt ≤ today ≤ endsAt. */
    public function scopeCurrent(Builder $query): Builder
    {
        $today = now()->toDateString();

        return $query->active()->whereDate('starts_at', '<=', $today)->whereDate('ends_at', '>=', $today);
    }

    public function imageUrl(): string
    {
        return $this->media?->url() ?? (string) $this->image_url;
    }

    public function revalidationTags(): array
    {
        return ['offers', 'home'];
    }
}

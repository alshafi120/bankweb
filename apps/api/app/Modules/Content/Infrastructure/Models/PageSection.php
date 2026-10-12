<?php

namespace App\Modules\Content\Infrastructure\Models;

use App\Support\Content\InvalidatesContentCache;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PageSection extends Model
{
    use InvalidatesContentCache;

    protected $fillable = ['page_id', 'type', 'position', 'is_visible', 'starts_at', 'ends_at', 'data'];

    protected $touches = ['page'];

    protected function casts(): array
    {
        return [
            'data' => 'array',
            'is_visible' => 'boolean',
            'position' => 'integer',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }

    /** Visible and inside its schedule window right now. */
    public function scopeLive(Builder $query): Builder
    {
        $now = now();

        return $query->where('is_visible', true)
            ->where(fn (Builder $q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
            ->where(fn (Builder $q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now));
    }

    public function revalidationTags(): array
    {
        return ['home', 'pages'];
    }
}

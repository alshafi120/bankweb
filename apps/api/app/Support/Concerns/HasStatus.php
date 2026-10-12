<?php

namespace App\Support\Concerns;

use Illuminate\Database\Eloquent\Builder;

/**
 * Status helpers. Content entities use ContentStatus (draft … published/scheduled/archived),
 * catalogue/network entities use ActiveStatus (active/inactive; jobs also `closed`).
 */
trait HasStatus
{
    public function scopeActive(Builder $query): Builder
    {
        return $query->where($this->qualifyColumn('status'), 'active');
    }

    /** Published and already live (published_at ≤ now). */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where($this->qualifyColumn('status'), 'published')
            ->where(fn (Builder $q) => $q->whereNull($this->qualifyColumn('published_at'))
                ->orWhere($this->qualifyColumn('published_at'), '<=', now()));
    }

    public function scopeWithStatus(Builder $query, string $status): Builder
    {
        return $query->where($this->qualifyColumn('status'), $status);
    }

    public function isActive(): bool
    {
        return $this->getAttribute('status') === 'active';
    }
}

<?php

namespace App\Support\Concerns;

use Illuminate\Database\Eloquent\Builder;

/** `position` ordering column: appended at the end on create, `ordered()` scope. */
trait HasPosition
{
    public static function bootHasPosition(): void
    {
        static::creating(function ($model): void {
            if ($model->getAttribute('position') === null) {
                $model->setAttribute('position', (int) static::query()->max('position') + 1);
            }
        });
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy($this->qualifyColumn('position'))->orderBy($this->qualifyColumn('id'));
    }
}

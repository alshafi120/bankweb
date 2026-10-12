<?php

namespace App\Support\Concerns;

use Illuminate\Support\Facades\Auth;

/** Fills `created_by` / `updated_by` from the authenticated admin. */
trait TracksAuthors
{
    public static function bootTracksAuthors(): void
    {
        static::creating(function ($model): void {
            $id = Auth::guard('web')->id();
            $model->setAttribute('created_by', $model->getAttribute('created_by') ?? $id);
            $model->setAttribute('updated_by', $model->getAttribute('updated_by') ?? $id);
        });
        static::updating(function ($model): void {
            if ($id = Auth::guard('web')->id()) {
                $model->setAttribute('updated_by', $id);
            }
        });
    }
}

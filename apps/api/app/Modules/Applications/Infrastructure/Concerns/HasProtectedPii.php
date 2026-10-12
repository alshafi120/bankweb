<?php

namespace App\Modules\Applications\Infrastructure\Concerns;

use App\Modules\Applications\Infrastructure\Models\ApplicationNote;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Support\Security\PiiHasher;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * Encrypted PII (`encrypted` cast) + HMAC lookup hashes, kept in sync on save.
 * Shared by applications, contact requests, complaints and job applications.
 */
trait HasProtectedPii
{
    public static function bootHasProtectedPii(): void
    {
        static::saving(function ($model): void {
            if ($model->isDirty('phone') && in_array('phone_hash', $model->piiHashColumns(), true)) {
                $model->setAttribute('phone_hash', PiiHasher::phone($model->phone));
            }
            if ($model->isDirty('national_id') && in_array('national_id_hash', $model->piiHashColumns(), true)) {
                $model->setAttribute('national_id_hash', PiiHasher::hash($model->national_id, 'national_id'));
            }
        });
    }

    /** @return list<string> */
    protected function piiHashColumns(): array
    {
        return ['phone_hash'];
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function notes(): MorphMany
    {
        return $this->morphMany(ApplicationNote::class, 'notable')->latest('id');
    }

    /** Exact-match search by phone/national id without decrypting the table. */
    public function scopeMatchingPii(Builder $query, string $term): Builder
    {
        $term = trim($term);
        $digits = preg_replace('/\D+/', '', $term) ?? '';

        return $query->where(function (Builder $q) use ($term, $digits) {
            $q->where('reference', 'like', '%'.addcslashes($term, '%_\\').'%')
                ->orWhere('full_name', 'like', '%'.addcslashes($term, '%_\\').'%');
            if (strlen($digits) >= 8) {
                $q->orWhere('phone_hash', PiiHasher::phone($digits));
                if (in_array('national_id_hash', $this->piiHashColumns(), true)) {
                    $q->orWhere('national_id_hash', PiiHasher::hash($digits, 'national_id'));
                }
            }
        });
    }
}

<?php

namespace App\Modules\Applications\Infrastructure\Models;

use App\Modules\Applications\Infrastructure\Concerns\HasProtectedPii;
use App\Modules\Audit\Infrastructure\Concerns\Auditable;
use App\Modules\Network\Infrastructure\Models\Branch;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/** Account / financing / card request ("intent", never a banking transaction). */
class Application extends Model
{
    use Auditable, HasFactory, HasProtectedPii;

    protected $fillable = [
        'reference', 'type', 'status', 'full_name', 'national_id', 'phone', 'email', 'city', 'locale', 'account_type',
        'branch_id', 'assigned_to', 'ip_hash', 'user_agent', 'submitted_at',
    ];

    protected $hidden = ['national_id', 'phone', 'national_id_hash', 'phone_hash', 'ip_hash'];

    protected function casts(): array
    {
        return [
            'national_id' => 'encrypted',
            'phone' => 'encrypted',
            'submitted_at' => 'datetime',
        ];
    }

    protected static function newFactory(): \Database\Factories\ApplicationFactory
    {
        return \Database\Factories\ApplicationFactory::new();
    }

    protected function piiHashColumns(): array
    {
        return ['phone_hash', 'national_id_hash'];
    }

    public function financingRequest(): HasOne
    {
        return $this->hasOne(FinancingRequest::class);
    }

    public function cardRequest(): HasOne
    {
        return $this->hasOne(CardRequest::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}

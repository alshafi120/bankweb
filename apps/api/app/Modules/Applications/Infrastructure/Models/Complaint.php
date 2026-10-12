<?php

namespace App\Modules\Applications\Infrastructure\Models;

use App\Modules\Applications\Infrastructure\Concerns\HasProtectedPii;
use App\Modules\Audit\Infrastructure\Concerns\Auditable;
use App\Modules\Network\Infrastructure\Models\Branch;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Complaint extends Model
{
    use Auditable, HasProtectedPii;

    protected $fillable = [
        'reference', 'status', 'full_name', 'phone', 'email', 'national_id', 'category', 'branch_id', 'transaction_date',
        'description', 'attachment_path', 'locale', 'assigned_to', 'resolved_at', 'ip_hash',
    ];

    protected $hidden = ['phone', 'phone_hash', 'national_id', 'national_id_hash', 'ip_hash', 'attachment_path'];

    protected function casts(): array
    {
        return [
            'phone' => 'encrypted',
            'national_id' => 'encrypted',
            'transaction_date' => 'date',
            'resolved_at' => 'datetime',
        ];
    }

    protected function piiHashColumns(): array
    {
        return ['phone_hash', 'national_id_hash'];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}

<?php

namespace App\Modules\Applications\Infrastructure\Models;

use App\Modules\Applications\Infrastructure\Concerns\HasProtectedPii;
use App\Modules\Audit\Infrastructure\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;

class ContactRequest extends Model
{
    use Auditable, HasProtectedPii;

    protected $fillable = [
        'reference', 'status', 'full_name', 'phone', 'email', 'subject', 'message', 'preferred_time', 'locale', 'assigned_to', 'ip_hash',
    ];

    protected $hidden = ['phone', 'phone_hash', 'ip_hash'];

    protected function casts(): array
    {
        return ['phone' => 'encrypted'];
    }

    public function auditResourceType(): string
    {
        return 'contact-requests';
    }
}

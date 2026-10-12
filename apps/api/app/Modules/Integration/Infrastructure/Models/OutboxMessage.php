<?php

namespace App\Modules\Integration\Infrastructure\Models;

use Illuminate\Database\Eloquent\Model;

class OutboxMessage extends Model
{
    protected $table = 'integration_outbox';

    protected $fillable = ['port', 'operation', 'payload', 'status', 'attempts', 'available_at', 'processed_at', 'last_error', 'idempotency_key'];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'attempts' => 'integer',
            'available_at' => 'datetime',
            'processed_at' => 'datetime',
        ];
    }
}

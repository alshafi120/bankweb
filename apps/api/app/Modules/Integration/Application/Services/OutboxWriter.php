<?php

namespace App\Modules\Integration\Application\Services;

use App\Modules\Integration\Infrastructure\Models\OutboxMessage;
use Illuminate\Support\Facades\DB;

/**
 * Transactional outbox: call inside the same DB transaction as the business write. A separate relay
 * (future Integration Service) reads `pending` rows and delivers them at-least-once; consumers dedupe
 * on `idempotency_key`.
 */
class OutboxWriter
{
    public function write(string $port, string $operation, array $payload, ?string $idempotencyKey = null): ?int
    {
        if ($idempotencyKey !== null) {
            $existing = OutboxMessage::query()->where('idempotency_key', $idempotencyKey)->value('id');
            if ($existing) {
                return (int) $existing;
            }
        }

        return DB::transaction(fn () => OutboxMessage::query()->create([
            'port' => $port,
            'operation' => $operation,
            'payload' => $payload,
            'status' => 'pending',
            'attempts' => 0,
            'available_at' => now(),
            'idempotency_key' => $idempotencyKey,
        ])->id);
    }
}

<?php

namespace App\Modules\Integration\Adapters;

use App\Modules\Integration\Application\Services\OutboxWriter;
use App\Modules\Integration\Ports\SmsPort;
use App\Support\Security\PiiHasher;

final class NullSmsAdapter implements SmsPort
{
    public function __construct(private readonly OutboxWriter $outbox, private readonly bool $enabled = false) {}

    public function send(string $phone, string $message, ?string $idempotencyKey = null): ?int
    {
        // The phone number is not written in clear: the relay resolves it from the request reference.
        return $this->enabled
            ? $this->outbox->write('sms', 'send', ['phoneHash' => PiiHasher::phone($phone), 'message' => $message], $idempotencyKey)
            : null;
    }
}

<?php

namespace App\Modules\Integration\Adapters;

use App\Modules\Integration\Application\Services\OutboxWriter;
use App\Modules\Integration\Ports\EmailPort;

final class NullEmailAdapter implements EmailPort
{
    public function __construct(private readonly OutboxWriter $outbox, private readonly bool $enabled = false) {}

    public function send(string $to, string $template, array $data = [], ?string $idempotencyKey = null): ?int
    {
        return $this->enabled ? $this->outbox->write('email', $template, ['to' => $to, 'data' => $data], $idempotencyKey) : null;
    }
}

<?php

namespace App\Modules\Integration\Ports;

interface SmsPort
{
    /** Queue an SMS (e.g. "your reference is WTQ-ACC-2026-000123"). Returns an outbox id. */
    public function send(string $phone, string $message, ?string $idempotencyKey = null): ?int;
}

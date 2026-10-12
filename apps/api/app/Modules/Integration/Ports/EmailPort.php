<?php

namespace App\Modules\Integration\Ports;

interface EmailPort
{
    /** Transactional e-mail through the bank's mail gateway. Returns an outbox id. */
    public function send(string $to, string $template, array $data = [], ?string $idempotencyKey = null): ?int;
}

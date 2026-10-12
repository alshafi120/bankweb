<?php

namespace App\Modules\Integration\Ports;

interface RemittancePort
{
    /** Public remittance tracking lookup (future). v1 returns null: not available. */
    public function trackStatus(string $trackingNumber): ?array;
}

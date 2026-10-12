<?php

namespace App\Modules\Integration\Adapters;

use App\Modules\Integration\Ports\RemittancePort;

final class NullRemittanceAdapter implements RemittancePort
{
    public function trackStatus(string $trackingNumber): ?array
    {
        return null; // Not available in v1.
    }
}

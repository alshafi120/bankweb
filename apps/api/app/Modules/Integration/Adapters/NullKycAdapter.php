<?php

namespace App\Modules\Integration\Adapters;

use App\Modules\Integration\Application\Services\OutboxWriter;
use App\Modules\Integration\Ports\KycPort;

final class NullKycAdapter implements KycPort
{
    public function __construct(private readonly OutboxWriter $outbox, private readonly bool $enabled = false) {}

    public function requestVerification(string $reference, array $subject): ?int
    {
        return $this->enabled ? $this->outbox->write('kyc', 'request_verification', ['reference' => $reference], "kyc:{$reference}") : null;
    }
}

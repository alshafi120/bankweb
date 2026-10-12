<?php

namespace App\Modules\Integration\Ports;

interface KycPort
{
    /** Request an identity check for an applicant (future eKYC provider). Returns an outbox id. */
    public function requestVerification(string $reference, array $subject): ?int;
}

<?php

namespace App\Modules\Integration\Ports;

/**
 * Contract for the future core-banking integration (implemented OUTSIDE this application).
 * v1 binding: NullCoreBankingAdapter — never reaches any banking system.
 */
interface CoreBankingPort
{
    /** Hand an account-opening intent to the onboarding queue of the bank. Returns an outbox id. */
    public function submitAccountOpeningIntent(string $reference, array $payload): ?int;

    /** Hand a financing intent to the credit workflow. Returns an outbox id. */
    public function submitFinancingIntent(string $reference, array $payload): ?int;

    /** Hand a card request intent to the card-issuing workflow. Returns an outbox id. */
    public function submitCardIntent(string $reference, array $payload): ?int;
}

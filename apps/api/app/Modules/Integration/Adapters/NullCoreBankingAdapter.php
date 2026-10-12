<?php

namespace App\Modules\Integration\Adapters;

use App\Modules\Integration\Application\Services\OutboxWriter;
use App\Modules\Integration\Ports\CoreBankingPort;

/**
 * v1 adapter: records the intent in the outbox ONLY. No network call, no core-banking DB access.
 * PII is never copied into the outbox — only the reference; the relay re-reads the request by reference.
 */
final class NullCoreBankingAdapter implements CoreBankingPort
{
    public function __construct(private readonly OutboxWriter $outbox, private readonly bool $enabled = false) {}

    public function submitAccountOpeningIntent(string $reference, array $payload): ?int
    {
        return $this->record('account_opening_intent', $reference, $payload);
    }

    public function submitFinancingIntent(string $reference, array $payload): ?int
    {
        return $this->record('financing_intent', $reference, $payload);
    }

    public function submitCardIntent(string $reference, array $payload): ?int
    {
        return $this->record('card_intent', $reference, $payload);
    }

    private function record(string $operation, string $reference, array $payload): ?int
    {
        if (! $this->enabled) {
            return null;
        }

        return $this->outbox->write('core_banking', $operation, ['reference' => $reference] + array_intersect_key($payload, array_flip(['type', 'productId', 'amount', 'months'])), "core:{$operation}:{$reference}");
    }
}

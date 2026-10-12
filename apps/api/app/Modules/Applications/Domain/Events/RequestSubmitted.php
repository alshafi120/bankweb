<?php

namespace App\Modules\Applications\Domain\Events;

use Illuminate\Foundation\Events\Dispatchable;

/** A public request (application / contact / complaint / job application) was stored. */
final class RequestSubmitted
{
    use Dispatchable;

    public function __construct(
        public readonly string $kind,       // applications | contact-requests | complaints | job-applications
        public readonly int $id,
        public readonly string $reference,
        public readonly string $type,       // account | financing | card | contact | complaint | job
    ) {}
}

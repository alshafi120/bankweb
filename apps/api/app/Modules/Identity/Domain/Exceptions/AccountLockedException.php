<?php

namespace App\Modules\Identity\Domain\Exceptions;

use Carbon\CarbonInterface;
use RuntimeException;

/** Rendered as HTTP 423 by App\Support\Http\ApiExceptionRenderer. */
class AccountLockedException extends RuntimeException
{
    public function __construct(public readonly ?CarbonInterface $lockedUntil = null)
    {
        parent::__construct('Account locked.');
    }

    public function retryAfter(): ?int
    {
        return $this->lockedUntil ? max(1, (int) now()->diffInSeconds($this->lockedUntil, true)) : null;
    }
}

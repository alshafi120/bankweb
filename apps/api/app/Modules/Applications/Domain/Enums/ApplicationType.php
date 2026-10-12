<?php

namespace App\Modules\Applications\Domain\Enums;

enum ApplicationType: string
{
    case Account = 'account';
    case Financing = 'financing';
    case Card = 'card';

    public function referencePrefix(): string
    {
        return match ($this) {
            self::Account => 'ACC',
            self::Financing => 'FIN',
            self::Card => 'CRD',
        };
    }
}

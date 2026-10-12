<?php

namespace App\Modules\Network\Domain\Enums;

enum ServiceType: string
{
    case Branch = 'branch';
    case Atm = 'atm';
    case Agent = 'agent';
}

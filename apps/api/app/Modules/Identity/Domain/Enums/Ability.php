<?php

namespace App\Modules\Identity\Domain\Enums;

enum Ability: string
{
    case View = 'view';
    case Create = 'create';
    case Update = 'update';
    case Delete = 'delete';
    case Publish = 'publish';
    case Approve = 'approve';
    case Export = 'export';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

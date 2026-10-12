<?php

namespace App\Modules\Applications\Domain\Enums;

enum ApplicationStatus: string
{
    case New = 'new';
    case InReview = 'in_review';
    case Contacted = 'contacted';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Closed = 'closed';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

<?php

namespace App\Modules\News\Domain\Enums;

/** Contract `ContentStatus` — workflow Draft → Review → Approved → Published/Scheduled → Archived. */
enum ContentStatus: string
{
    case Draft = 'draft';
    case PendingReview = 'pending_review';
    case Approved = 'approved';
    case Published = 'published';
    case Scheduled = 'scheduled';
    case Archived = 'archived';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

<?php

namespace App\Modules\Identity\Domain\Enums;

/** Contract type `Role` (packages/api-types). */
enum Role: string
{
    case SuperAdmin = 'super_admin';
    case ContentManager = 'content_manager';
    case NewsManager = 'news_manager';
    case MarketingManager = 'marketing_manager';
    case HrManager = 'hr_manager';
    case BranchManager = 'branch_manager';
    case CustomerService = 'customer_service';
    case Reviewer = 'reviewer';
    case Viewer = 'viewer';

    /** @return array{ar: string, en: string} */
    public function label(): array
    {
        return match ($this) {
            self::SuperAdmin => ['ar' => 'مدير النظام', 'en' => 'Super admin'],
            self::ContentManager => ['ar' => 'مدير المحتوى', 'en' => 'Content manager'],
            self::NewsManager => ['ar' => 'مدير الأخبار', 'en' => 'News manager'],
            self::MarketingManager => ['ar' => 'مدير التسويق', 'en' => 'Marketing manager'],
            self::HrManager => ['ar' => 'مدير الموارد البشرية', 'en' => 'HR manager'],
            self::BranchManager => ['ar' => 'مدير الفروع', 'en' => 'Branch manager'],
            self::CustomerService => ['ar' => 'خدمة العملاء', 'en' => 'Customer service'],
            self::Reviewer => ['ar' => 'مراجع', 'en' => 'Reviewer'],
            self::Viewer => ['ar' => 'مشاهد', 'en' => 'Viewer'],
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

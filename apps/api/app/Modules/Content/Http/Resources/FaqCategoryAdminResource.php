<?php

namespace App\Modules\Content\Http\Resources;

use App\Modules\Content\Infrastructure\Models\FaqCategory;
use App\Support\Admin\AdminResource;
use App\Support\Admin\Field;

class FaqCategoryAdminResource extends AdminResource
{
    public function key(): string
    {
        return 'faq-categories';
    }

    public function permissionResource(): string
    {
        return 'faqs';
    }

    public function model(): string
    {
        return FaqCategory::class;
    }

    public function statuses(): array
    {
        return [];
    }

    public function fields(): array
    {
        return ['slug' => Field::slug(), 'name' => Field::localized('name', true, 120)];
    }

    public function searchable(): array
    {
        return ['name_ar', 'name_en', 'slug'];
    }
}

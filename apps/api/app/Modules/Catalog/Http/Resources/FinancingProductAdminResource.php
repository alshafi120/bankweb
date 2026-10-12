<?php

namespace App\Modules\Catalog\Http\Resources;

use App\Modules\Catalog\Infrastructure\Models\FinancingProduct;
use App\Support\Admin\AdminResource;
use App\Support\Admin\Field;

class FinancingProductAdminResource extends AdminResource
{
    public function key(): string
    {
        return 'financing-products';
    }

    public function model(): string
    {
        return FinancingProduct::class;
    }

    public function fields(): array
    {
        return [
            'slug' => Field::slug(),
            'name' => Field::localized('name', true),
            'summary' => Field::localized('summary', false, 1000),
            'body' => Field::html('body'),
            'maxAmount' => Field::int('max_amount', true, 1, PHP_INT_MAX),
            'maxMonths' => Field::int('max_months', true, 1, 360),
            'annualProfitRate' => Field::decimal('annual_profit_rate', true, 0, 100),
            'requirements' => Field::list('requirements'),
        ];
    }

    public function searchable(): array
    {
        return ['name_ar', 'name_en', 'slug'];
    }
}

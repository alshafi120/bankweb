<?php

namespace App\Modules\Catalog\Http\Resources;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Support\Admin\AdminResource;
use App\Support\Admin\Field;
use Illuminate\Database\Eloquent\Model;

class ProductAdminResource extends AdminResource
{
    public function key(): string
    {
        return 'products';
    }

    public function model(): string
    {
        return Product::class;
    }

    public function fields(): array
    {
        return [
            'slug' => Field::slug(),
            'accountType' => Field::enum('account_type', ['current', 'savings', 'investment', 'business']),
            'name' => Field::localized('name', true),
            'tagline' => Field::localized('tagline'),
            'features' => Field::list('features'),
            'requirements' => Field::list('requirements'),
            'minimumBalance' => Field::int('minimum_balance', false, 0, PHP_INT_MAX),
            'currency' => Field::enum('currency', ['YER'], false),
        ];
    }

    public function searchable(): array
    {
        return ['name_ar', 'name_en', 'slug'];
    }

    public function filters(): array
    {
        return ['accountType' => 'account_type'];
    }

    protected function extend(Model $model, array $out): array
    {
        $out['currency'] = 'YER';
        $out['href'] = '/accounts/'.$model->slug;

        return $out;
    }
}

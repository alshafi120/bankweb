<?php

namespace App\Modules\News\Http\Resources;

use App\Modules\News\Infrastructure\Models\NewsCategory;
use App\Support\Admin\AdminResource;
use App\Support\Admin\Field;
use Illuminate\Database\Eloquent\Model;

class NewsCategoryAdminResource extends AdminResource
{
    public function key(): string
    {
        return 'news-categories';
    }

    public function model(): string
    {
        return NewsCategory::class;
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

    protected function extend(Model $model, array $out): array
    {
        $out['newsCount'] = $model->news()->count();

        return $out;
    }
}

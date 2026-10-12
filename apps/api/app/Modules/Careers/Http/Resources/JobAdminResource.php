<?php

namespace App\Modules\Careers\Http\Resources;

use App\Modules\Careers\Infrastructure\Models\Job;
use App\Support\Admin\AdminResource;
use App\Support\Admin\Field;
use Illuminate\Database\Eloquent\Model;

class JobAdminResource extends AdminResource
{
    public function key(): string
    {
        return 'jobs';
    }

    public function model(): string
    {
        return Job::class;
    }

    public function statuses(): array
    {
        return ['active', 'inactive', 'closed'];
    }

    public function with(): array
    {
        return ['city'];
    }

    public function fields(): array
    {
        return [
            'slug' => Field::slug(),
            'title' => Field::localized('title', true),
            'department' => Field::localized('department', false, 160),
            'cityId' => Field::fk('city_id', 'cities'),
            'employmentType' => Field::enum('employment_type', ['full_time', 'part_time', 'contract', 'internship']),
            'summary' => Field::localized('summary', false, 1000),
            'description' => Field::html('description'),
            'requirements' => Field::list('requirements'),
            'closesAt' => Field::date('closes_at'),
        ];
    }

    public function searchable(): array
    {
        return ['title_ar', 'title_en', 'slug'];
    }

    public function filters(): array
    {
        return ['cityId' => 'city_id', 'employmentType' => 'employment_type'];
    }

    public function bulkStatus(string $action): ?string
    {
        return $action === 'archive' ? 'closed' : parent::bulkStatus($action);
    }

    protected function extend(Model $model, array $out): array
    {
        $out['city'] = $model->city?->localized('name');
        $out['applicationsCount'] = $model->applications()->count();

        return $out;
    }
}

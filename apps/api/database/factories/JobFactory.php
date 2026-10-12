<?php

namespace Database\Factories;

use App\Modules\Careers\Infrastructure\Models\Job;
use App\Modules\Network\Infrastructure\Models\City;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Job> */
class JobFactory extends Factory
{
    protected $model = Job::class;

    public function definition(): array
    {
        return [
            'title_ar' => 'وظيفة تجريبية',
            'title_en' => fake()->unique()->jobTitle(),
            'department_ar' => 'تقنية المعلومات',
            'department_en' => 'Information Technology',
            'city_id' => fn () => City::query()->value('id') ?? City::query()->create(['slug' => 'sanaa', 'name_ar' => 'صنعاء', 'name_en' => "Sana'a"])->id,
            'employment_type' => 'full_time',
            'summary_ar' => 'ملخص الوظيفة.',
            'summary_en' => 'Role summary.',
            'description_ar' => '<p>الوصف.</p>',
            'description_en' => '<p>Description.</p>',
            'requirements_ar' => ['مؤهل جامعي'],
            'requirements_en' => ['University degree'],
            'closes_at' => now()->addMonth()->toDateString(),
            'status' => 'active',
        ];
    }
}

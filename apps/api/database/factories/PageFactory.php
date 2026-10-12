<?php

namespace Database\Factories;

use App\Modules\Content\Infrastructure\Models\Page;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Page> */
class PageFactory extends Factory
{
    protected $model = Page::class;

    public function definition(): array
    {
        return [
            'slug' => fake()->unique()->slug(2),
            'title_ar' => 'صفحة تجريبية',
            'title_en' => fake()->sentence(3),
            'summary_ar' => 'ملخص الصفحة.',
            'summary_en' => fake()->sentence(8),
            'template' => 'default',
            'status' => 'published',
            'published_at' => now()->subDay(),
        ];
    }
}

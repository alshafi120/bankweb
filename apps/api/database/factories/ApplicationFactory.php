<?php

namespace Database\Factories;

use App\Modules\Applications\Application\Services\ReferenceGenerator;
use App\Modules\Applications\Infrastructure\Models\Application;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Application> Fictional applicants only. */
class ApplicationFactory extends Factory
{
    protected $model = Application::class;

    public function definition(): array
    {
        return [
            'reference' => ReferenceGenerator::format('ACC', (int) now()->format('Y'), fake()->unique()->numberBetween(900000, 999999)),
            'type' => 'account',
            'status' => 'new',
            'full_name' => 'محمد أحمد التجريبي',
            'national_id' => (string) fake()->numerify('0#########'),
            'phone' => '9677'.fake()->randomElement(['1', '3', '7', '8']).fake()->numerify('#######'),
            'email' => fake()->unique()->safeEmail(),
            'city' => 'صنعاء',
            'locale' => 'ar',
            'account_type' => 'current',
            'submitted_at' => now(),
        ];
    }
}

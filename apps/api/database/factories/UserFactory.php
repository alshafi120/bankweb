<?php

namespace Database\Factories;

use App\Modules\Identity\Infrastructure\Models\Role;
use App\Modules\Identity\Infrastructure\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<User> */
class UserFactory extends Factory
{
    protected $model = User::class;

    public const PASSWORD = 'Str0ng!Passw0rd#2026';

    private static ?string $hash = null;

    public function definition(): array
    {
        $username = Str::lower(fake()->unique()->bothify('user.????##'));

        return [
            'name' => fake()->name(),
            'username' => $username,
            'email' => $username.'@withaq.example',
            'password' => self::$hash ??= \Illuminate\Support\Facades\Hash::make(self::PASSWORD),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }

    /** Attach a seeded role by name (run PermissionSeeder + RoleSeeder first). */
    public function withRole(string $role): static
    {
        return $this->afterCreating(function (User $user) use ($role) {
            $user->roles()->attach(Role::query()->where('name', $role)->value('id'));
            $user->flushPermissionCache();
        });
    }
}

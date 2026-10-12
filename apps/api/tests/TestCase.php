<?php

namespace Tests;

use App\Modules\Identity\Infrastructure\Models\User;
use Database\Factories\UserFactory;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\RateLimiter;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    /** Origin of the admin SPA (SANCTUM_STATEFUL_DOMAINS in phpunit.xml) → stateful cookie session. */
    protected const ADMIN_ORIGIN = 'http://localhost:3001';

    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear('');
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);
    }

    protected function seedRbac(): void
    {
        $this->seed([PermissionSeeder::class, RoleSeeder::class]);
    }

    /** A user holding one seeded role, signed in on the stateful (admin) guard. */
    protected function actingAsRole(string $role): User
    {
        $this->seedRbac();
        $user = User::factory()->withRole($role)->create();

        return $this->signIn($user);
    }

    /** Switch the signed-in admin (resets cached guards, incl. Sanctum's request guard). */
    protected function signIn(User $user): User
    {
        $this->app['auth']->forgetGuards();
        $this->actingAs($user, 'web');

        return $user;
    }

    /** JSON request from the admin origin (Sanctum treats it as first-party/stateful). */
    protected function admin(string $method, string $uri, array $data = []): \Illuminate\Testing\TestResponse
    {
        return $this->withHeaders(['Origin' => self::ADMIN_ORIGIN, 'Referer' => self::ADMIN_ORIGIN.'/'])
            ->json($method, '/api/admin/v1'.$uri, $data);
    }

    protected function strongPassword(): string
    {
        return UserFactory::PASSWORD;
    }
}

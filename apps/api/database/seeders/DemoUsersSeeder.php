<?php

namespace Database\Seeders;

use App\Modules\Identity\Domain\Enums\Role as RoleEnum;
use App\Modules\Identity\Infrastructure\Models\Role;
use App\Modules\Identity\Infrastructure\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use RuntimeException;

/**
 * LOCAL ONLY: one fictional user per role (`<role>@withaq.example`, username = role) so every
 * permission set can be tried in the dashboard. Password from DEMO_USERS_PASSWORD (never hard-coded);
 * skipped when it is not set.
 */
class DemoUsersSeeder extends Seeder
{
    private const NAMES = [
        'super_admin' => 'Demo Super Admin',
        'content_manager' => 'Yousef Al-Haddad',
        'news_manager' => 'Mona Bawazir',
        'marketing_manager' => 'Khaled Al-Absi',
        'hr_manager' => 'Rania Al-Qadhi',
        'branch_manager' => 'Fahd Ba-Shammakh',
        'customer_service' => 'Sami Al-Wazir',
        'reviewer' => 'Huda Al-Maqtari',
        'viewer' => 'Omar Al-Hakimi',
    ];

    public function run(): void
    {
        if (! app()->environment('local', 'testing')) {
            throw new RuntimeException('DemoUsersSeeder only runs with APP_ENV=local.');
        }
        $password = (string) env('DEMO_USERS_PASSWORD', '');
        if ($password === '') {
            $this->command?->warn('DEMO_USERS_PASSWORD not set: skipping demo users.');

            return;
        }
        $v = Validator::make(['password' => $password], ['password' => [Password::min(12)->mixedCase()->letters()->numbers()->symbols()]]);
        if ($v->fails()) {
            throw new RuntimeException('DemoUsersSeeder refused: DEMO_USERS_PASSWORD must be ≥ 12 chars with upper, lower, digit and symbol.');
        }

        foreach (RoleEnum::cases() as $role) {
            $username = 'demo.'.$role->value;
            $user = User::query()->firstOrCreate(
                ['username' => $username],
                ['name' => self::NAMES[$role->value], 'email' => str_replace('_', '-', $role->value).'@withaq.example', 'password' => $password, 'is_active' => true],
            );
            $user->roles()->sync([Role::query()->where('name', $role->value)->valueOrFail('id')]);
        }

        $this->command?->info('Demo users: demo.<role> / <role-with-dashes>@withaq.example (password = DEMO_USERS_PASSWORD).');
    }
}

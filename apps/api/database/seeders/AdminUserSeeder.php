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
 * First super admin from ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME (/ ADMIN_USERNAME).
 * No password is ever hard-coded: the seeder refuses to run when the password is missing or weak.
 * Existing users are never overwritten.
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = mb_strtolower(trim((string) env('ADMIN_EMAIL', '')));
        $password = (string) env('ADMIN_PASSWORD', '');
        $name = trim((string) env('ADMIN_NAME', 'System Administrator'));
        $username = trim((string) env('ADMIN_USERNAME', 'admin'));

        $validator = Validator::make(compact('email', 'password', 'username'), [
            'email' => ['required', 'email:rfc'],
            'username' => ['required', 'regex:/^[a-z0-9._-]{3,60}$/i'],
            'password' => ['required', Password::min(12)->mixedCase()->letters()->numbers()->symbols()],
        ]);
        if ($validator->fails()) {
            throw new RuntimeException('AdminUserSeeder refused: set ADMIN_EMAIL, ADMIN_USERNAME and a strong ADMIN_PASSWORD (≥ 12 chars, upper, lower, digit, symbol). '
                .implode(' ', $validator->errors()->all()));
        }

        if (User::query()->where('email', $email)->orWhere('username', $username)->exists()) {
            $this->command?->warn("Admin user {$email} already exists — left unchanged.");

            return;
        }

        $user = User::query()->create([
            'name' => $name,
            'username' => $username,
            'email' => $email,
            'password' => $password,
            'is_active' => true,
        ]);
        $user->forceFill(['password_changed_at' => now()])->save();
        $user->roles()->sync([Role::query()->where('name', RoleEnum::SuperAdmin->value)->valueOrFail('id')]);

        $this->command?->info("Super admin {$email} created. Remove ADMIN_PASSWORD from the environment and enable 2FA at first login.");
    }
}

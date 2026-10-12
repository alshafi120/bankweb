<?php

namespace Tests\Feature\Admin;

use App\Modules\Audit\Infrastructure\Models\AuditLog;
use App\Modules\Identity\Infrastructure\Models\User;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

class AuthTest extends TestCase
{
    private function makeAdmin(array $attrs = []): User
    {
        $this->seedRbac();

        return User::factory()->withRole('content_manager')->create(array_merge(['username' => 'editor', 'email' => 'editor@withaq.example'], $attrs));
    }

    public function test_login_by_email_or_username(): void
    {
        $this->makeAdmin();

        $this->admin('POST', '/auth/login', ['login' => 'editor@withaq.example', 'password' => $this->strongPassword()])
            ->assertOk()
            ->assertJsonPath('data.twoFactorRequired', false)
            ->assertJsonPath('data.user.username', 'editor')
            ->assertJsonStructure(['data' => ['user' => ['id', 'name', 'email', 'username', 'roles', 'permissions', 'twoFactorEnabled', 'isActive', 'lastLoginAt', 'createdAt']]]);
        $this->admin('GET', '/auth/me')->assertOk()->assertJsonPath('data.roles', ['content_manager']);
        $this->admin('POST', '/auth/logout')->assertNoContent();

        $this->admin('POST', '/auth/login', ['login' => 'editor', 'password' => $this->strongPassword()])->assertOk();
        $this->assertTrue(AuditLog::query()->where('action', 'login')->exists());
    }

    public function test_wrong_password_is_422_and_audited(): void
    {
        $this->makeAdmin();

        $this->admin('POST', '/auth/login', ['login' => 'editor', 'password' => 'wrong-password'])
            ->assertUnprocessable()->assertJsonValidationErrors('login');
        $this->admin('GET', '/auth/me')->assertUnauthorized();
        $this->assertTrue(AuditLog::query()->where('action', 'login_failed')->exists());
    }

    public function test_five_failures_lock_the_account_with_423(): void
    {
        $user = $this->makeAdmin();

        for ($i = 0; $i < 4; $i++) {
            $this->admin('POST', '/auth/login', ['login' => 'editor', 'password' => 'nope'])->assertUnprocessable();
        }
        $this->admin('POST', '/auth/login', ['login' => 'editor', 'password' => 'nope'])->assertStatus(423)->assertHeader('Retry-After');

        // Even the right password is refused while locked.
        $this->admin('POST', '/auth/login', ['login' => 'editor', 'password' => $this->strongPassword()])->assertStatus(423);
        $this->assertNotNull($user->fresh()->locked_until);
        $this->assertTrue(AuditLog::query()->where('action', 'lockout')->exists());
    }

    public function test_two_factor_challenge(): void
    {
        $g = new Google2FA;
        $secret = $g->generateSecretKey(32);
        $this->makeAdmin(['two_factor_secret' => $secret, 'two_factor_confirmed_at' => now()]);

        $this->admin('POST', '/auth/login', ['login' => 'editor', 'password' => $this->strongPassword()])
            ->assertOk()->assertJsonPath('data.twoFactorRequired', true)->assertJsonPath('data.user', null);
        $this->admin('GET', '/auth/me')->assertUnauthorized();

        $this->admin('POST', '/auth/two-factor-challenge', ['code' => '000000'])->assertUnprocessable();
        $this->admin('POST', '/auth/two-factor-challenge', ['code' => $g->getCurrentOtp($secret)])
            ->assertOk()->assertJsonPath('data.user.twoFactorEnabled', true);
        $this->admin('GET', '/auth/me')->assertOk();
    }

    public function test_two_factor_challenge_without_pending_login_is_401(): void
    {
        $this->admin('POST', '/auth/two-factor-challenge', ['code' => '123456'])->assertUnauthorized();
    }

    public function test_two_factor_enrolment_returns_qr_svg_and_hashed_recovery_codes(): void
    {
        $user = $this->actingAsRole('viewer');

        $setup = $this->admin('POST', '/auth/two-factor')->assertOk()->assertJsonStructure(['data' => ['secret', 'otpauthUrl', 'qrSvg']]);
        $this->assertStringContainsString('<svg', $setup->json('data.qrSvg'));
        $this->assertStringNotContainsString('<script', $setup->json('data.qrSvg'));

        $code = (new Google2FA)->getCurrentOtp($setup->json('data.secret'));
        $codes = $this->admin('POST', '/auth/two-factor/confirm', ['code' => $code])->assertOk()->json('data.recoveryCodes');
        $this->assertCount(8, $codes);
        $stored = $user->fresh()->two_factor_recovery_codes;
        $this->assertNotContains($codes[0], $stored);   // only hashes are stored
    }

    public function test_change_password_enforces_policy(): void
    {
        $this->actingAsRole('viewer');

        $this->admin('PUT', '/auth/password', ['currentPassword' => $this->strongPassword(), 'password' => 'short', 'passwordConfirmation' => 'short'])
            ->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->admin('PUT', '/auth/password', ['currentPassword' => 'wrong', 'password' => 'N3w!Passw0rd#2026', 'passwordConfirmation' => 'N3w!Passw0rd#2026'])
            ->assertUnprocessable()->assertJsonValidationErrors('currentPassword');
        $this->admin('PUT', '/auth/password', ['currentPassword' => $this->strongPassword(), 'password' => 'N3w!Passw0rd#2026', 'passwordConfirmation' => 'N3w!Passw0rd#2026'])
            ->assertNoContent();
    }

    public function test_forgot_password_never_reveals_accounts(): void
    {
        $this->admin('POST', '/auth/forgot-password', ['email' => 'nobody@example.com'])->assertStatus(202);
    }

    public function test_guest_gets_401_on_admin_endpoints(): void
    {
        $this->admin('GET', '/dashboard')->assertUnauthorized()->assertExactJson(['message' => 'Unauthenticated.']);
    }
}

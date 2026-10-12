<?php

namespace App\Modules\Identity\Application\Actions;

use App\Modules\Audit\Application\Services\AuditLogger;
use App\Modules\Audit\Domain\Enums\AuditAction;
use App\Modules\Identity\Domain\Exceptions\AccountLockedException;
use App\Modules\Identity\Infrastructure\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Login with username or e-mail.
 *  - 5 consecutive failures → account locked 15 min (HTTP 423) + audit `lockout`.
 *  - Inactive accounts are rejected with the same generic message (no account enumeration).
 *  - Unknown users still pay the hashing cost (timing-safe).
 *  - 2FA enabled → password step only stores a pending login id in the session; the user is logged
 *    in after /two-factor-challenge.
 *  - Session id regenerated on every privilege change.
 */
class AuthenticateAdmin
{
    public const PENDING_KEY = 'auth.2fa.pending';

    public function __construct(private readonly AuditLogger $audit) {}

    /** @return array{twoFactorRequired: bool, user: ?User} */
    public function attempt(Request $request, string $login, string $password, bool $remember): array
    {
        $login = trim($login);
        $user = User::query()
            ->where(fn ($q) => $q->where('email', mb_strtolower($login))->orWhere('username', $login))
            ->first();

        if ($user === null) {
            Hash::check($password, self::dummyHash()); // equalise timing with the "user exists" path
            $this->audit->log(AuditAction::LoginFailed, 'auth', ['after' => ['login' => mb_substr($login, 0, 120)]]);
            $this->failed();
        }

        if ($user->isLocked()) {
            throw new AccountLockedException($user->locked_until);
        }

        if (! Hash::check($password, $user->getAuthPassword())) {
            $this->registerFailure($user);
        }

        if (! $user->is_active) {
            $this->audit->log(AuditAction::LoginFailed, $user, ['after' => ['reason' => 'inactive']], userId: $user->id);
            $this->failed();
        }

        if (Hash::needsRehash($user->getAuthPassword())) {
            $user->forceFill(['password' => $password])->saveQuietly();
        }

        $user->forceFill(['failed_login_attempts' => 0, 'locked_until' => null])->saveQuietly();

        if ($user->hasTwoFactorEnabled()) {
            $request->session()->regenerate();
            $request->session()->put(self::PENDING_KEY, ['id' => $user->id, 'remember' => $remember, 'at' => now()->timestamp]);

            return ['twoFactorRequired' => true, 'user' => null];
        }

        $this->completeLogin($request, $user, $remember);

        return ['twoFactorRequired' => false, 'user' => $user];
    }

    public function completeLogin(Request $request, User $user, bool $remember = false): void
    {
        Auth::guard('web')->login($user, $remember);
        $request->session()->regenerate();
        $request->session()->forget(self::PENDING_KEY);

        $user->forceFill(['last_login_at' => now(), 'last_login_ip' => $request->ip(), 'failed_login_attempts' => 0])->saveQuietly();
        $this->audit->log(AuditAction::Login, $user, null, $user->id);
    }

    public function registerFailure(User $user): never
    {
        $attempts = $user->failed_login_attempts + 1;
        $max = (int) config('bank.admin.max_login_attempts', 5);

        if ($attempts >= $max) {
            $until = now()->addMinutes((int) config('bank.admin.lockout_minutes', 15));
            $user->forceFill(['failed_login_attempts' => 0, 'locked_until' => $until])->saveQuietly();
            $this->audit->log(AuditAction::Lockout, $user, ['after' => ['lockedUntil' => $until->toIso8601String()]], $user->id);

            throw new AccountLockedException($until);
        }

        $user->forceFill(['failed_login_attempts' => $attempts])->saveQuietly();
        $this->audit->log(AuditAction::LoginFailed, $user, ['after' => ['attempt' => $attempts]], $user->id);

        $this->failed();
    }

    private static function dummyHash(): string
    {
        static $hash = null;

        return $hash ??= Hash::make('timing-equaliser-'.config('app.key'));
    }

    private function failed(): never
    {
        throw ValidationException::withMessages(['login' => ['These credentials do not match our records.']]);
    }
}

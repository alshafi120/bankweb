<?php

namespace App\Modules\Identity\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Modules\Audit\Application\Services\AuditLogger;
use App\Modules\Audit\Domain\Enums\AuditAction;
use App\Modules\Identity\Application\Actions\AuthenticateAdmin;
use App\Modules\Identity\Application\Services\TwoFactorService;
use App\Modules\Identity\Http\Resources\AdminUserResource;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Support\Http\ApiResponse;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

/** /api/admin/v1/auth/* (docs/API.md §2 "المصادقة"). */
class AuthController extends Controller
{
    public function __construct(
        private readonly AuthenticateAdmin $auth,
        private readonly TwoFactorService $twoFactor,
        private readonly AuditLogger $audit,
    ) {}

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'login' => ['required', 'string', 'max:190'],
            'password' => ['required', 'string', 'max:255'],
            'remember' => ['sometimes', 'boolean'],
        ]);

        $result = $this->auth->attempt($request, $data['login'], $data['password'], (bool) ($data['remember'] ?? false));

        return ApiResponse::data([
            'twoFactorRequired' => $result['twoFactorRequired'],
            'user' => $result['user'] ? AdminUserResource::make($result['user']->fresh()) : null,
        ]);
    }

    public function twoFactorChallenge(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['nullable', 'required_without:recoveryCode', 'string', 'max:10'],
            'recoveryCode' => ['nullable', 'required_without:code', 'string', 'max:32'],
        ]);

        $pending = $request->session()->get(AuthenticateAdmin::PENDING_KEY);
        // The pending password step is valid for 5 minutes.
        if (! is_array($pending) || now()->timestamp - (int) ($pending['at'] ?? 0) > 300) {
            $request->session()->forget(AuthenticateAdmin::PENDING_KEY);

            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $user = User::query()->find($pending['id']);
        if (! $user || ! $user->is_active || ! $user->hasTwoFactorEnabled()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }
        if ($user->isLocked()) {
            throw new \App\Modules\Identity\Domain\Exceptions\AccountLockedException($user->locked_until);
        }

        $valid = filled($data['code'] ?? null)
            ? $this->twoFactor->verifyCode($user, (string) $data['code'])
            : $this->twoFactor->useRecoveryCode($user, (string) $data['recoveryCode']);

        if (! $valid) {
            try {
                $this->auth->registerFailure($user);
            } catch (ValidationException) {
                throw ValidationException::withMessages([filled($data['code'] ?? null) ? 'code' : 'recoveryCode' => ['The provided code is invalid.']]);
            }
        }

        $this->auth->completeLogin($request, $user, (bool) ($pending['remember'] ?? false));

        return ApiResponse::data(['user' => AdminUserResource::make($user->fresh())]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $this->audit->log(AuditAction::Logout, $user, null, $user->id);
        }
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return ApiResponse::noContent();
    }

    public function me(Request $request): JsonResponse
    {
        return ApiResponse::data(AdminUserResource::make($request->user()));
    }

    /** Always 202 — never reveals whether the e-mail exists. */
    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'string', 'email', 'max:190']]);
        $user = User::query()->where('email', mb_strtolower($data['email']))->where('is_active', true)->first();
        if ($user) {
            Password::broker()->sendResetLink(['email' => $user->email]);
        }

        return response()->json(null, 202);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:190'],
            'password' => ['required', 'string', 'max:255', 'same:passwordConfirmation', PasswordRule::defaults()],
            'passwordConfirmation' => ['required', 'string'],
        ]);

        $status = Password::broker()->reset(
            ['email' => mb_strtolower($data['email']), 'token' => $data['token'], 'password' => $data['password']],
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                    'password_changed_at' => now(),
                    'failed_login_attempts' => 0,
                    'locked_until' => null,
                ])->save();
                DB::table(config('session.table', 'sessions'))->where('user_id', $user->id)->delete();
                event(new PasswordReset($user));
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['token' => ['This password reset link is invalid or has expired.']]);
        }

        return ApiResponse::noContent();
    }

    public function enableTwoFactor(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        if ($user->hasTwoFactorEnabled()) {
            throw ValidationException::withMessages(['code' => ['Two-factor authentication is already enabled.']]);
        }

        return ApiResponse::data($this->twoFactor->beginSetup($user));
    }

    public function confirmTwoFactor(Request $request): JsonResponse
    {
        $data = $request->validate(['code' => ['required', 'string', 'max:10']]);
        /** @var User $user */
        $user = $request->user();

        $codes = $this->twoFactor->confirm($user, $data['code']);
        if ($codes === null) {
            throw ValidationException::withMessages(['code' => ['The provided code is invalid.']]);
        }
        $request->session()->regenerate();
        $this->audit->log(AuditAction::Update, $user, ['after' => ['twoFactor' => 'enabled']]);

        return ApiResponse::data(['recoveryCodes' => $codes]);
    }

    public function disableTwoFactor(Request $request): JsonResponse
    {
        $data = $request->validate(['password' => ['required', 'string', 'max:255']]);
        /** @var User $user */
        $user = $request->user();
        if (! Hash::check($data['password'], $user->getAuthPassword())) {
            throw ValidationException::withMessages(['password' => ['The password is incorrect.']]);
        }
        if (config('bank.admin.require_2fa') && $user->hasAnyRole((array) config('bank.admin.require_2fa_roles'))) {
            return response()->json(['message' => 'Two-factor authentication is mandatory for your role.'], 403);
        }

        $this->twoFactor->disable($user);
        $this->audit->log(AuditAction::Update, $user, ['after' => ['twoFactor' => 'disabled']]);

        return ApiResponse::noContent();
    }

    public function changePassword(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validate([
            'currentPassword' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'max:255', 'same:passwordConfirmation', 'different:currentPassword', PasswordRule::defaults()],
            'passwordConfirmation' => ['required', 'string'],
        ]);

        if (! Hash::check($data['currentPassword'], $user->getAuthPassword())) {
            throw ValidationException::withMessages(['currentPassword' => ['The current password is incorrect.']]);
        }

        $user->forceFill(['password' => $data['password'], 'password_changed_at' => now()])->save();
        // Sign out every other session, keep (and rotate) this one.
        Auth::guard('web')->logoutOtherDevices($data['password']);
        DB::table(config('session.table', 'sessions'))->where('user_id', $user->id)
            ->where('id', '!=', $request->session()->getId())->delete();
        $request->session()->regenerate();

        return ApiResponse::noContent();
    }

    public function sessions(Request $request): JsonResponse
    {
        $current = $request->session()->getId();
        $rows = DB::table(config('session.table', 'sessions'))
            ->where('user_id', $request->user()->id)
            ->orderByDesc('last_activity')
            ->get(['id', 'ip_address', 'user_agent', 'last_activity']);

        return ApiResponse::data($rows->map(fn ($s) => [
            'id' => hash('sha256', $s->id),   // never expose raw session ids
            'ipAddress' => (string) $s->ip_address,
            'userAgent' => Str::limit((string) $s->user_agent, 200),
            'lastActiveAt' => now()->setTimestamp((int) $s->last_activity)->toIso8601String(),
            'current' => hash_equals($s->id, $current),
        ])->values()->all());
    }

    public function revokeSession(Request $request, string $id): JsonResponse
    {
        $table = DB::table(config('session.table', 'sessions'));
        $match = $table->where('user_id', $request->user()->id)->get(['id'])
            ->first(fn ($s) => hash_equals(hash('sha256', $s->id), $id));

        abort_if($match === null, 404);
        abort_if(hash_equals($match->id, $request->session()->getId()), 422, 'Use logout to end the current session.');

        DB::table(config('session.table', 'sessions'))->where('id', $match->id)->delete();

        return ApiResponse::noContent();
    }
}

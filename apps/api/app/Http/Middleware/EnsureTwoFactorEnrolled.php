<?php

namespace App\Http\Middleware;

use App\Modules\Identity\Infrastructure\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * ADMIN_REQUIRE_2FA=true → super_admin / content_manager must enrol TOTP before using the API.
 * The auth routes needed to enrol (me, two-factor setup/confirm, logout) are excluded at route level.
 */
class EnsureTwoFactorEnrolled
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var User|null $user */
        $user = $request->user();

        if ($user && config('bank.admin.require_2fa') && ! $user->hasTwoFactorEnabled()
            && $user->hasAnyRole((array) config('bank.admin.require_2fa_roles'))) {
            return response()->json([
                'message' => 'Two-factor authentication must be enabled for your role.',
                'code' => 'two_factor_enrollment_required',
            ], 403);
        }

        return $next($request);
    }
}

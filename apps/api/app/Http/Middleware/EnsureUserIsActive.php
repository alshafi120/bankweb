<?php

namespace App\Http\Middleware;

use App\Modules\Identity\Infrastructure\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/** A user deactivated or locked while signed in loses access on the next request. */
class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var User|null $user */
        $user = $request->user();

        if ($user && (! $user->is_active || $user->isLocked())) {
            Auth::guard('web')->logout();
            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            return $user->isLocked()
                ? response()->json(['message' => 'Account locked.', 'lockedUntil' => $user->locked_until?->toIso8601String()], 423)
                : response()->json(['message' => 'Account disabled.'], 403);
        }

        return $next($request);
    }
}

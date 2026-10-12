<?php

namespace App\Http\Middleware;

use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

/**
 * Sanctum's stateful middleware, but keeping the configured SameSite policy (strict) instead of
 * forcing "lax". Requests whose Origin/Referer is not in SANCTUM_STATEFUL_DOMAINS (e.g. the public
 * Next.js server calling /api/v1) get no session and no CSRF check.
 */
class EnsureStatefulAdminRequests extends EnsureFrontendRequestsAreStateful
{
    protected function configureSecureCookieSessions()
    {
        config([
            'session.http_only' => true,
            'session.same_site' => config('session.same_site', 'strict') ?: 'strict',
        ]);
    }
}

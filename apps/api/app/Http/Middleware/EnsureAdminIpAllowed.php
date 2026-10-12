<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\IpUtils;
use Symfony\Component\HttpFoundation\Response;

/** Optional ADMIN_IP_ALLOWLIST (CIDRs) on top of Cloudflare Zero Trust. Empty → disabled. */
class EnsureAdminIpAllowed
{
    public function handle(Request $request, Closure $next): Response
    {
        $allow = (array) config('bank.admin.ip_allowlist', []);
        if ($allow !== [] && ! IpUtils::checkIp((string) $request->ip(), $allow)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return $next($request);
    }
}

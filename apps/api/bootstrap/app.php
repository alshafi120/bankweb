<?php

use App\Http\Middleware\EnsureAdminIpAllowed;
use App\Http\Middleware\EnsureStatefulAdminRequests;
use App\Http\Middleware\EnsureTwoFactorEnrolled;
use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\Honeypot;
use App\Http\Middleware\NoStore;
use App\Http\Middleware\SecurityHeaders;
use App\Support\Http\ApiExceptionRenderer;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Cloudflare → Nginx → PHP-FPM. TRUSTED_PROXIES = comma separated CIDRs (or "*" when the
        // app is only reachable from the proxy network). X-Forwarded-* only, never Forwarded.
        $proxies = (string) env('TRUSTED_PROXIES', '');
        $middleware->trustProxies(
            at: $proxies === '*' ? '*' : array_values(array_filter(array_map('trim', explode(',', $proxies)))),
            headers: Request::HEADER_X_FORWARDED_FOR | Request::HEADER_X_FORWARDED_HOST
                | Request::HEADER_X_FORWARDED_PORT | Request::HEADER_X_FORWARDED_PROTO,
        );

        $middleware->append(SecurityHeaders::class);

        // Sanctum SPA (cookie) authentication for the admin host only. Our subclass keeps
        // SameSite=Strict (Sanctum's default middleware forces "lax").
        $middleware->api(prepend: [EnsureStatefulAdminRequests::class]);

        $middleware->alias([
            'admin.active' => EnsureUserIsActive::class,
            'admin.2fa' => EnsureTwoFactorEnrolled::class,
            'admin.ip' => EnsureAdminIpAllowed::class,
            'honeypot' => Honeypot::class,
            'no-store' => NoStore::class,
        ]);

        $middleware->encryptCookies(except: []);
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*', 'sanctum/*') || $request->expectsJson());
        $exceptions->dontReport([App\Modules\Identity\Domain\Exceptions\AccountLockedException::class]);
        $exceptions->render(new ApiExceptionRenderer);
    })->create();

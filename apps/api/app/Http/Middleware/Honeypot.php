<?php

namespace App\Http\Middleware;

use App\Modules\Applications\Application\Services\ReferenceGenerator;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Public forms: a filled `website` field means a bot. Answer exactly like a success (201 with a
 * plausible reference) WITHOUT validating, saving or notifying anything — never tell a bot it was caught.
 * Usage: ->middleware('honeypot:CB') or 'honeypot:application' (prefix chosen from the `type` field).
 */
class Honeypot
{
    public function handle(Request $request, Closure $next, string $prefix = 'ACC'): Response
    {
        $trap = $request->input('website');

        if (is_string($trap) && trim($trap) !== '') {
            if ($prefix === 'application') {
                $prefix = ReferenceGenerator::prefixForApplicationType((string) $request->input('type'));
            }

            return response()->json(['data' => ['reference' => ReferenceGenerator::fake($prefix)]], 201);
        }

        return $next($request);
    }
}

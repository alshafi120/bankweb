<?php

namespace App\Support\Http;

use App\Modules\Identity\Domain\Exceptions\AccountLockedException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

/**
 * Uniform JSON errors (docs/API.md): never leak class names, SQL or stack traces.
 * 422 keeps Laravel's default `{ message, errors }` shape.
 */
class ApiExceptionRenderer
{
    public function __invoke(Throwable $e, Request $request)
    {
        if (! $request->is('api/*', 'sanctum/*') && ! $request->expectsJson()) {
            return null;
        }

        return match (true) {
            $e instanceof AccountLockedException => response()->json([
                'message' => 'Account locked. Try again later.',
                'lockedUntil' => $e->lockedUntil?->toIso8601String(),
            ], 423, $e->retryAfter() ? ['Retry-After' => (string) $e->retryAfter()] : []),
            $e instanceof ModelNotFoundException,
            $e instanceof NotFoundHttpException => response()->json(['message' => 'Not found.'], 404),
            $e instanceof AuthenticationException => response()->json(['message' => 'Unauthenticated.'], 401),
            $e instanceof AuthorizationException,
            $e instanceof AccessDeniedHttpException => response()->json(['message' => $this->forbiddenMessage($e)], 403),
            default => null,
        };
    }

    private function forbiddenMessage(Throwable $e): string
    {
        $message = $e->getMessage();

        return $message === '' || $message === 'This action is unauthorized.' ? 'Forbidden.' : $message;
    }
}

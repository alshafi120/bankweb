<?php

namespace App\Modules\Applications\Application\Services;

use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Cloudflare Turnstile server-side verification. When `services.turnstile.secret` is empty
 * (local development) verification is skipped. Fails closed on network errors.
 */
class TurnstileVerifier
{
    public function enabled(): bool
    {
        return filled(config('services.turnstile.secret'));
    }

    public function verify(?string $token, ?string $ip = null): bool
    {
        if (! $this->enabled()) {
            return true;
        }
        if (blank($token) || strlen((string) $token) > 4096) {
            return false;
        }

        try {
            $response = Http::asForm()
                ->timeout((int) config('services.turnstile.timeout', 5))
                ->post((string) config('services.turnstile.verify_url'), array_filter([
                    'secret' => config('services.turnstile.secret'),
                    'response' => $token,
                    'remoteip' => $ip,
                ]));

            return $response->ok() && $response->json('success') === true;
        } catch (Throwable $e) {
            report($e);

            return false;
        }
    }
}

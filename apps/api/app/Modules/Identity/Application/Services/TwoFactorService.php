<?php

namespace App\Modules\Identity\Application\Services;

use App\Modules\Identity\Infrastructure\Models\User;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

/**
 * TOTP (RFC 6238) with pragmarx/google2fa. Secret stored encrypted; recovery codes stored as
 * hashes only (shown once); each TOTP time-step can be used once (replay protection).
 */
class TwoFactorService
{
    public function __construct(private readonly Google2FA $google2fa) {}

    /** @return array{secret: string, otpauthUrl: string, qrSvg: string} */
    public function beginSetup(User $user): array
    {
        $secret = $this->google2fa->generateSecretKey(32);
        $user->forceFill(['two_factor_secret' => $secret, 'two_factor_confirmed_at' => null, 'two_factor_recovery_codes' => null])->save();

        $issuer = (string) config('app.name');
        $url = $this->google2fa->getQRCodeUrl($issuer, $user->email, $secret);

        return ['secret' => $secret, 'otpauthUrl' => $url, 'qrSvg' => $this->qrSvg($url)];
    }

    /** @return list<string>|null plain recovery codes (show once) or null if the code is wrong */
    public function confirm(User $user, string $code): ?array
    {
        if ($user->two_factor_secret === null || ! $this->verifyCode($user, $code)) {
            return null;
        }

        $codes = $this->generateRecoveryCodes();
        $user->forceFill([
            'two_factor_confirmed_at' => now(),
            'two_factor_recovery_codes' => array_map(fn (string $c) => Hash::make($c), $codes),
        ])->save();

        return $codes;
    }

    public function disable(User $user): void
    {
        $user->forceFill(['two_factor_secret' => null, 'two_factor_recovery_codes' => null, 'two_factor_confirmed_at' => null])->save();
    }

    public function verifyCode(User $user, string $code): bool
    {
        $code = preg_replace('/\s+/', '', $code) ?? '';
        if (! preg_match('/^\d{6}$/', $code) || $user->two_factor_secret === null) {
            return false;
        }

        $cacheKey = '2fa:last-ts:'.$user->id;
        $lastTimestamp = Cache::get($cacheKey);
        $timestamp = $this->google2fa->verifyKeyNewer($user->two_factor_secret, $code, $lastTimestamp, 1);
        if ($timestamp === false) {
            return false;
        }
        // verifyKeyNewer returns the matched timestep (int) or true on old google2fa versions.
        Cache::put($cacheKey, is_int($timestamp) ? $timestamp : $this->google2fa->getTimestamp(), now()->addMinutes(5));

        return true;
    }

    /** Consumes a recovery code (single use). */
    public function useRecoveryCode(User $user, string $code): bool
    {
        $code = strtoupper(trim($code));
        $hashes = (array) ($user->two_factor_recovery_codes ?? []);
        foreach ($hashes as $i => $hash) {
            if (is_string($hash) && Hash::check($code, $hash)) {
                unset($hashes[$i]);
                $user->forceFill(['two_factor_recovery_codes' => array_values($hashes)])->save();

                return true;
            }
        }

        return false;
    }

    /** @return list<string> */
    private function generateRecoveryCodes(): array
    {
        $n = (int) config('bank.admin.recovery_codes', 8);
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $part = function () use ($alphabet): string {
            $s = '';
            for ($i = 0; $i < 4; $i++) {
                $s .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }

            return $s;
        };

        return array_map(fn () => $part().'-'.$part().'-'.$part(), range(1, $n));
    }

    private function qrSvg(string $url): string
    {
        $writer = new Writer(new ImageRenderer(new RendererStyle(220, 1), new SvgImageBackEnd));
        $svg = $writer->writeString($url);

        return trim(Str::after($svg, '?>'));
    }
}

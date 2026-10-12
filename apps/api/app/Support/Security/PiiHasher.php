<?php

namespace App\Support\Security;

use Illuminate\Support\Str;

/**
 * Keyed hashes (HMAC-SHA256 with the application key) for exact-match search on encrypted PII
 * (`phone_hash`, `national_id_hash`) and for storing IPs without keeping the raw address.
 */
final class PiiHasher
{
    public static function hash(?string $value, string $purpose = 'pii'): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return hash_hmac('sha256', $purpose.'|'.$value, self::key());
    }

    public static function phone(?string $phone): ?string
    {
        return self::hash(self::normalizePhone($phone), 'phone');
    }

    public static function ip(?string $ip): ?string
    {
        return self::hash($ip, 'ip');
    }

    /** Visitor fingerprint with a daily rotating salt: cannot be correlated across days. */
    public static function visitor(?string $ip, ?string $userAgent, string $date): string
    {
        return hash_hmac('sha256', $date.'|'.$ip.'|'.$userAgent, self::key().'|visitor|'.$date);
    }

    /** +967 77 123 4567 → 967771234567 (canonical form used for hashing). */
    public static function normalizePhone(?string $phone): ?string
    {
        if ($phone === null) {
            return null;
        }
        $digits = preg_replace('/\D+/', '', $phone) ?? '';
        if ($digits !== '' && ! str_starts_with($digits, '967')) {
            $digits = '967'.$digits;
        }

        return $digits ?: null;
    }

    private static function key(): string
    {
        $key = (string) config('app.key');

        return Str::startsWith($key, 'base64:') ? (string) base64_decode(substr($key, 7)) : $key;
    }
}

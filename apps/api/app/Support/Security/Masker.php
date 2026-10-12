<?php

namespace App\Support\Security;

/** Partial masking of personal data for admin screens and exports. */
final class Masker
{
    public static function phone(?string $phone): string
    {
        $digits = preg_replace('/\D+/', '', (string) $phone) ?? '';
        if ($digits === '') {
            return '—';
        }
        $tail = substr($digits, -3);

        return str_starts_with($digits, '967') ? '+967 7•• ••• '.$tail : '••• ••• '.$tail;
    }

    public static function nationalId(?string $id): string
    {
        $id = (string) $id;

        return $id === '' ? '—' : str_repeat('•', max(0, strlen($id) - 4)).substr($id, -4);
    }

    public static function email(?string $email): ?string
    {
        if (! $email || ! str_contains($email, '@')) {
            return $email ?: null;
        }
        [$user, $domain] = explode('@', $email, 2);

        return mb_substr($user, 0, 2).str_repeat('•', max(1, mb_strlen($user) - 2)).'@'.$domain;
    }
}

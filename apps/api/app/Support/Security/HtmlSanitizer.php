<?php

namespace App\Support\Security;

use Mews\Purifier\Facades\Purifier;

final class HtmlSanitizer
{
    /** Strict allow-list from config/purifier.php "default". */
    public static function clean(string $html): string
    {
        return trim((string) Purifier::clean($html, 'default'));
    }

    /** Plain text: tags removed, whitespace collapsed. */
    public static function plain(?string $text): string
    {
        return trim((string) preg_replace('/\s+/u', ' ', strip_tags((string) $text)));
    }
}

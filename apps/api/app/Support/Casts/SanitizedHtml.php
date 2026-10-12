<?php

namespace App\Support\Casts;

use App\Support\Security\HtmlSanitizer;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Rich-text column: every write goes through the HTMLPurifier allow-list (config/purifier.php),
 * whatever the entry point (admin API, seeders, tinker, jobs).
 */
class SanitizedHtml implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        return $value === null ? null : (string) $value;
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        return $value === null || $value === '' ? $value : HtmlSanitizer::clean((string) $value);
    }
}

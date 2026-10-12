<?php

namespace App\Support\Concerns;

/**
 * Bilingual columns helper: `title_ar` / `title_en` ⇄ `['ar' => …, 'en' => …]` (contract type `Localized`).
 * JSON list columns (`features_ar` / `features_en`) ⇄ `LocalizedList`.
 */
trait HasLocalizedAttributes
{
    /** @return array{ar: string, en: string} */
    public function localized(string $base): array
    {
        return [
            'ar' => (string) ($this->getAttribute($base.'_ar') ?? ''),
            'en' => (string) ($this->getAttribute($base.'_en') ?? ''),
        ];
    }

    /** Same as localized() but null when both languages are empty (optional contract fields). */
    public function localizedOrNull(string $base): ?array
    {
        $value = $this->localized($base);

        return $value['ar'] === '' && $value['en'] === '' ? null : $value;
    }

    /** @return array{ar: list<string>, en: list<string>} */
    public function localizedList(string $base): array
    {
        $list = fn ($v) => array_values(array_map('strval', is_array($v) ? $v : []));

        return [
            'ar' => $list($this->getAttribute($base.'_ar')),
            'en' => $list($this->getAttribute($base.'_en')),
        ];
    }

    /** Write a Localized value into its two columns. */
    public function setLocalized(string $base, ?array $value): static
    {
        foreach (static::localizedToColumns($base, $value) as $column => $v) {
            $this->setAttribute($column, $v);
        }

        return $this;
    }

    /**
     * Map a Localized (or LocalizedList) input to its columns.
     *
     * @return array<string, mixed>
     */
    public static function localizedToColumns(string $base, ?array $value): array
    {
        return [
            $base.'_ar' => $value['ar'] ?? null,
            $base.'_en' => $value['en'] ?? null,
        ];
    }
}

<?php

namespace App\Support\Admin;

use App\Modules\Media\Infrastructure\Models\Media;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\Rule;

/**
 * Declarative admin field: one definition drives validation rules (camelCase input),
 * mapping into DB columns (snake_case, *_ar/*_en) and serialisation back to the contract shape.
 */
final class Field
{
    private function __construct(
        public readonly string $kind,
        public readonly ?string $column,
        public bool $required = false,
        public bool $nullable = true,
        public ?int $max = null,
        public ?int $min = null,
        public array $options = [],
        public ?string $table = null,
        public bool $readOnly = false,
        public bool $unique = false,
    ) {}

    /** Bilingual short text → `{ar, en}`. */
    public static function localized(string $base, bool $required = false, int $max = 255): self
    {
        return new self('localized', $base, required: $required, nullable: ! $required, max: $max);
    }

    /** Bilingual rich text (sanitised by the model cast). */
    public static function html(string $base, bool $required = false): self
    {
        return new self('html', $base, required: $required, nullable: ! $required, max: 200_000);
    }

    /** Bilingual list → `{ar: string[], en: string[]}`. */
    public static function list(string $base): self
    {
        return new self('list', $base);
    }

    public static function string(string $column, bool $required = false, int $max = 255): self
    {
        return new self('string', $column, required: $required, nullable: ! $required, max: $max);
    }

    public static function url(string $column, bool $required = false): self
    {
        return new self('url', $column, required: $required, nullable: ! $required, max: 500);
    }

    public static function slug(): self
    {
        return new self('slug', 'slug', max: 120, unique: true);
    }

    public static function int(string $column, bool $required = false, int $min = 0, ?int $max = null): self
    {
        return new self('int', $column, required: $required, nullable: ! $required, max: $max, min: $min);
    }

    public static function decimal(string $column, bool $required = false, int $min = 0, ?int $max = null): self
    {
        return new self('decimal', $column, required: $required, nullable: ! $required, max: $max, min: $min);
    }

    public static function bool(string $column): self
    {
        return new self('bool', $column, nullable: false);
    }

    public static function date(string $column, bool $required = false): self
    {
        return new self('date', $column, required: $required, nullable: ! $required);
    }

    public static function datetime(string $column): self
    {
        return new self('datetime', $column);
    }

    /** @param  list<string>  $options */
    public static function enum(string $column, array $options, bool $required = true): self
    {
        return new self('enum', $column, required: $required, nullable: ! $required, options: $options);
    }

    /** Foreign key → `xxxId`. */
    public static function fk(string $column, string $table, bool $required = false): self
    {
        return new self('fk', $column, required: $required, nullable: ! $required, table: $table);
    }

    /** Media FK → `MediaRef | null` in output; accepts `{id}` or a number. */
    public static function media(string $column): self
    {
        return new self('media', $column);
    }

    public static function decimalCoordinate(string $column): self
    {
        return new self('decimal', $column, required: true, nullable: false, min: -180, max: 180);
    }

    public function readOnly(): self
    {
        $this->readOnly = true;

        return $this;
    }

    /** @return array<string, list<mixed>> */
    public function rules(string $key, bool $creating, Model $model): array
    {
        if ($this->readOnly) {
            return [];
        }
        $presence = $creating && $this->required ? 'required' : ($this->nullable ? 'nullable' : 'sometimes');
        $max = $this->max !== null ? ['max:'.$this->max] : [];

        return match ($this->kind) {
            'localized', 'html' => [
                $key => [$creating && $this->required ? 'required' : 'sometimes', $this->nullable ? 'nullable' : 'present', 'array:ar,en'],
                "{$key}.ar" => [$this->required ? 'required_with:'.$key : 'nullable', 'nullable', 'string', ...$max],
                "{$key}.en" => [$this->required ? 'required_with:'.$key : 'nullable', 'nullable', 'string', ...$max],
            ],
            'list' => [
                $key => ['sometimes', 'nullable', 'array:ar,en'],
                "{$key}.ar" => ['nullable', 'array', 'max:50'],
                "{$key}.en" => ['nullable', 'array', 'max:50'],
                "{$key}.ar.*" => ['string', 'max:500'],
                "{$key}.en.*" => ['string', 'max:500'],
            ],
            'string' => [$key => [$presence, 'string', ...$max]],
            'url' => [$key => [$presence, 'string', 'max:500', 'regex:#^(https?://|/|\#|mailto:|tel:)#i']],
            'slug' => [$key => [
                'sometimes', 'nullable', 'string', 'max:120', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique($model->getTable(), 'slug')->ignore($model->getKey()),
            ]],
            'int' => [$key => [$presence, 'integer', 'min:'.$this->min, ...$max]],
            'decimal' => [$key => [$presence, 'numeric', 'min:'.$this->min, ...$max]],
            'bool' => [$key => ['sometimes', 'boolean']],
            'date' => [$key => [$presence, 'date_format:Y-m-d']],
            'datetime' => [$key => ['sometimes', 'nullable', 'date']],
            'enum' => [$key => [$presence, Rule::in($this->options)]],
            'fk' => [$key => [$presence, 'integer', Rule::exists($this->table, 'id')]],
            'media' => [
                $key => ['sometimes', 'nullable'],
                "{$key}.id" => ['sometimes', 'integer', Rule::exists('media', 'id')],
            ],
        };
    }

    /** Map one validated input value into the model's columns. */
    public function fill(Model $model, mixed $value): void
    {
        if ($this->readOnly || $this->column === null) {
            return;
        }

        match ($this->kind) {
            'localized', 'html' => $model->fill([
                $this->column.'_ar' => $value['ar'] ?? null,
                $this->column.'_en' => $value['en'] ?? null,
            ]),
            'list' => $model->fill([
                $this->column.'_ar' => array_values(array_filter((array) ($value['ar'] ?? []), fn ($v) => trim((string) $v) !== '')),
                $this->column.'_en' => array_values(array_filter((array) ($value['en'] ?? []), fn ($v) => trim((string) $v) !== '')),
            ]),
            'string', 'url' => $model->fill([$this->column => $value === null ? null : trim((string) $value)]),
            'int', 'fk' => $model->fill([$this->column => $value === null ? null : (int) $value]),
            'decimal' => $model->fill([$this->column => $value === null ? null : (float) $value]),
            'bool' => $model->fill([$this->column => (bool) $value]),
            'media' => $model->fill([$this->column => is_array($value) ? ($value['id'] ?? null) : ($value === null ? null : (int) $value)]),
            default => $model->fill([$this->column => $value]),
        };
    }

    /** Serialise the column(s) back to the contract value. */
    public function present(Model $model): mixed
    {
        $c = $this->column;

        return match ($this->kind) {
            'localized', 'html' => ['ar' => (string) ($model->getAttribute($c.'_ar') ?? ''), 'en' => (string) ($model->getAttribute($c.'_en') ?? '')],
            'list' => [
                'ar' => array_values((array) ($model->getAttribute($c.'_ar') ?? [])),
                'en' => array_values((array) ($model->getAttribute($c.'_en') ?? [])),
            ],
            'int', 'fk' => $model->getAttribute($c) === null ? null : (int) $model->getAttribute($c),
            'decimal' => $model->getAttribute($c) === null ? null : (float) $model->getAttribute($c),
            'bool' => (bool) $model->getAttribute($c),
            'date' => $model->getAttribute($c)?->toDateString(),
            'datetime' => $model->getAttribute($c)?->toIso8601String(),
            'media' => $this->presentMedia($model),
            default => $model->getAttribute($c),
        };
    }

    private function presentMedia(Model $model): ?array
    {
        $id = $model->getAttribute($this->column);
        if (! $id) {
            return null;
        }
        $media = Media::query()->find($id);

        return $media?->toRef();
    }
}

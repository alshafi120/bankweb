<?php

namespace App\Support\Admin;

use App\Modules\Identity\Domain\PermissionMatrix;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Support\Concerns\HasPosition;
use App\Support\Concerns\HasSeo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Gate;

/**
 * Declarative definition of one admin CRUD resource (`/api/admin/v1/{key}`).
 * The generic ResourceController does list/create/show/update/delete/bulk/reorder; resources
 * override hooks only where behaviour is specific.
 */
abstract class AdminResource
{
    /** URL segment, e.g. "financing-products". */
    abstract public function key(): string;

    /** @return class-string<Model> */
    abstract public function model(): string;

    /** @return array<string, Field> camelCase input/output key → field */
    abstract public function fields(): array;

    /** Permission resource ("<resource>.<ability>"); defaults to key(). */
    public function permissionResource(): string
    {
        return $this->key();
    }

    /** @return list<string> */
    public function statuses(): array
    {
        return ['active', 'inactive'];
    }

    /** @return list<string> columns searched with LIKE by `search` */
    public function searchable(): array
    {
        return [];
    }

    /** @return array<string, string> filter[key] → column (exact match) */
    public function filters(): array
    {
        return [];
    }

    /** @return array<string, string> sort key (camelCase) → column */
    public function sorts(): array
    {
        $sorts = ['createdAt' => 'created_at', 'updatedAt' => 'updated_at', 'id' => 'id'];
        // Every scalar field is sortable by its column; localized fields sort by the Arabic column.
        foreach ($this->fields() as $key => $field) {
            if ($field->column === null) {
                continue;
            }
            if (in_array($field->kind, ['string', 'url', 'slug', 'int', 'decimal', 'bool', 'date', 'datetime', 'enum', 'fk'], true)) {
                $sorts[$key] = $field->column;
            } elseif ($field->kind === 'localized') {
                $sorts[$key] = $field->column.'_ar';
            }
        }
        if ($this->hasStatus()) {
            $sorts['status'] = 'status';
        }
        if ($this->hasPosition()) {
            $sorts['position'] = 'position';
        }

        return $sorts;
    }

    public function defaultSort(): string
    {
        return $this->hasPosition() ? 'position' : '-createdAt';
    }

    /** @return list<string> eager loads for list/show */
    public function with(): array
    {
        return [];
    }

    public function query(): Builder
    {
        return ($this->model())::query()->with($this->with());
    }

    public function hasPosition(): bool
    {
        return in_array(HasPosition::class, class_uses_recursive($this->model()), true);
    }

    public function hasSeo(): bool
    {
        return in_array(HasSeo::class, class_uses_recursive($this->model()), true);
    }

    public function softDeletes(): bool
    {
        return in_array(SoftDeletes::class, class_uses_recursive($this->model()), true);
    }

    public function hasStatus(): bool
    {
        return $this->statuses() !== [];
    }

    /** Ability names valid for this resource (from the permission matrix). */
    public function abilities(): array
    {
        return PermissionMatrix::RESOURCES[$this->permissionResource()] ?? ['view', 'create', 'update', 'delete'];
    }

    public function can(User $user, string $ability): bool
    {
        return Gate::forUser($user)->allows($this->permissionResource().'.'.$ability);
    }

    /** Ability required to change `status` (separation of duties: publish ≠ edit). */
    public function statusAbility(): string
    {
        return in_array('publish', $this->abilities(), true) ? 'publish' : 'update';
    }

    /** @return array<string, list<mixed>> */
    public function rules(bool $creating, ?Model $model): array
    {
        $rules = [];
        // Unique rules need the table even when creating (no model yet).
        $subject = $model ?? new ($this->model());
        foreach ($this->fields() as $key => $field) {
            $rules += $field->rules($key, $creating, $subject);
        }
        if ($this->hasStatus()) {
            $rules['status'] = ['sometimes', 'in:'.implode(',', $this->statuses())];
        }
        if ($this->hasPosition()) {
            $rules['position'] = ['sometimes', 'integer', 'min:0', 'max:100000'];
        }
        if ($this->hasSeo()) {
            $rules += self::seoRules();
        }

        // extraRules() replaces generated rules for the same key.
        return array_replace($rules, $this->extraRules($creating, $model));
    }

    /** @return array<string, list<mixed>> */
    public function extraRules(bool $creating, ?Model $model): array
    {
        return [];
    }

    /** @return array<string, list<mixed>> */
    public static function seoRules(string $prefix = 'seo'): array
    {
        return [
            $prefix => ['sometimes', 'nullable', 'array'],
            "{$prefix}.title" => ['sometimes', 'array:ar,en'],
            "{$prefix}.title.*" => ['nullable', 'string', 'max:255'],
            "{$prefix}.description" => ['sometimes', 'array:ar,en'],
            "{$prefix}.description.*" => ['nullable', 'string', 'max:500'],
            "{$prefix}.keywords" => ['sometimes', 'nullable', 'array:ar,en'],
            "{$prefix}.keywords.*" => ['nullable', 'string', 'max:500'],
            "{$prefix}.canonical" => ['sometimes', 'nullable', 'string', 'max:500', 'regex:#^(https?://|/)#i'],
            "{$prefix}.ogImage" => ['sometimes', 'nullable', 'array'],
            "{$prefix}.ogImage.id" => ['sometimes', 'integer', 'exists:media,id'],
            "{$prefix}.noindex" => ['sometimes', 'boolean'],
        ];
    }

    /** Fill the model from validated input (only keys present in the request). */
    public function fill(Model $model, array $data, User $user, bool $creating): void
    {
        foreach ($this->fields() as $key => $field) {
            if (array_key_exists($key, $data)) {
                $field->fill($model, $data[$key]);
            }
        }
        if ($this->hasStatus() && array_key_exists('status', $data)) {
            $model->setAttribute('status', $data['status']);
        }
        if ($this->hasPosition() && array_key_exists('position', $data)) {
            $model->setAttribute('position', (int) $data['position']);
        }
    }

    /** Hook after save (relations, SEO, nested items). */
    public function afterSave(Model $model, array $data, User $user, bool $creating): void
    {
        if ($this->hasSeo() && array_key_exists('seo', $data)) {
            $model->syncSeo($data['seo']);
        }
    }

    /** Hook to veto a delete (e.g. last super admin). Return an error message or null. */
    public function deleteBlockedReason(Model $model, User $user): ?string
    {
        return null;
    }

    /** Admin record shape. */
    public function present(Model $model): array
    {
        $out = ['id' => $model->getKey()];
        foreach ($this->fields() as $key => $field) {
            $out[$key] = $field->present($model);
        }
        if ($this->hasStatus()) {
            $out['status'] = $model->getAttribute('status');
        }
        if ($this->hasPosition()) {
            $out['position'] = (int) $model->getAttribute('position');
        }
        if ($this->hasSeo()) {
            $title = $this->seoFallbackTitle($model);
            $out['seo'] = $model->seoPayload($title, ['ar' => '', 'en' => '']);
        }
        $out['createdAt'] = $model->getAttribute('created_at')?->toIso8601String();
        $out['updatedAt'] = $model->getAttribute('updated_at')?->toIso8601String();

        return $this->extend($model, $out);
    }

    /** Add resource-specific keys to the presented record. */
    protected function extend(Model $model, array $out): array
    {
        return $out;
    }

    /** @return array{ar: string, en: string} */
    protected function seoFallbackTitle(Model $model): array
    {
        foreach (['title', 'name'] as $base) {
            if ($model->getAttribute($base.'_ar') !== null) {
                return ['ar' => (string) $model->getAttribute($base.'_ar'), 'en' => (string) $model->getAttribute($base.'_en')];
            }
        }

        return ['ar' => '', 'en' => ''];
    }

    /**
     * Bulk action → status value (null = not applicable to this resource).
     */
    public function bulkStatus(string $action): ?string
    {
        $content = in_array('draft', $this->statuses(), true);

        return match ($action) {
            'publish' => $content ? 'published' : 'active',
            'unpublish' => $content ? 'draft' : 'inactive',
            'archive' => $content ? 'archived' : 'inactive',
            'activate' => $content ? null : 'active',
            'deactivate' => $content ? null : 'inactive',
            default => null,
        };
    }
}

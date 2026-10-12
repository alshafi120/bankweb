<?php

namespace App\Modules\Identity\Http\Resources;

use App\Modules\Audit\Application\Services\AuditLogger;
use App\Modules\Audit\Domain\Enums\AuditAction;
use App\Modules\Identity\Domain\Enums\Role as RoleEnum;
use App\Modules\Identity\Domain\PermissionMatrix;
use App\Modules\Identity\Infrastructure\Models\Permission;
use App\Modules\Identity\Infrastructure\Models\Role;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Support\Admin\AdminResource;
use App\Support\Admin\Field;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\Rule;

/** `AdminRole`. Permissions change only through PUT /roles/{id}/permissions (audited). */
class RoleAdminResource extends AdminResource
{
    public function key(): string
    {
        return 'roles';
    }

    public function model(): string
    {
        return Role::class;
    }

    public function statuses(): array
    {
        return [];
    }

    public function with(): array
    {
        return ['permissions'];
    }

    public function fields(): array
    {
        return [
            'name' => Field::string('name', true, 60),
            'label' => Field::localized('label', true, 120),
            'description' => Field::string('description', false, 500),
        ];
    }

    public function extraRules(bool $creating, ?Model $model): array
    {
        $builtIn = $model !== null && in_array($model->getAttribute('name'), RoleEnum::values(), true);

        return [
            // Built-in role identifiers are immutable (the admin form re-sends the unchanged value).
            'name' => $builtIn
                ? ['sometimes', Rule::in([$model->getAttribute('name')])]
                : [$creating ? 'required' : 'sometimes', 'string', 'max:60', 'regex:/^[a-z][a-z0-9_]*$/', Rule::unique('roles', 'name')->ignore($model?->getKey())],
            // The generic edit form sends the whole matrix; changes are audited as change_permissions.
            'permissions' => ['sometimes', 'array', 'max:300'],
            'permissions.*' => ['string', 'distinct', Rule::in(PermissionMatrix::all())],
            'usersCount' => ['sometimes'],
        ];
    }

    public function afterSave(Model $model, array $data, User $user, bool $creating): void
    {
        /** @var Role $model */
        if (! array_key_exists('permissions', $data) || $model->name === RoleEnum::SuperAdmin->value) {
            return;
        }
        $before = $model->permissions()->pluck('name')->sort()->values()->all();
        $wanted = collect($data['permissions'])->unique()->sort()->values()->all();
        if ($before === $wanted) {
            return;
        }
        abort_unless($user->can('roles.update'), 403, 'Forbidden.');
        $model->permissions()->sync(Permission::query()->whereIn('name', $wanted)->pluck('id')->all());
        $model->unsetRelation('permissions');
        app(AuditLogger::class)->log(AuditAction::ChangePermissions, $model, ['before' => ['permissions' => $before], 'after' => ['permissions' => $wanted]]);
    }

    public function defaultSort(): string
    {
        return 'id';
    }

    public function searchable(): array
    {
        return ['name', 'label_ar', 'label_en'];
    }

    public function deleteBlockedReason(Model $model, User $user): ?string
    {
        if (in_array($model->name, RoleEnum::values(), true)) {
            return 'Built-in roles cannot be deleted.';
        }

        return $model->users()->exists() ? 'Remove the role from its users first.' : null;
    }

    protected function extend(Model $model, array $out): array
    {
        /** @var Role $model */
        $out['permissions'] = $model->name === RoleEnum::SuperAdmin->value
            ? PermissionMatrix::all()
            : $model->permissions->pluck('name')->sort()->values()->all();
        $out['usersCount'] = $model->users()->count();

        return $out;
    }
}

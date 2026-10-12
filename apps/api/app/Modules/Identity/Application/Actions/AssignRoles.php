<?php

namespace App\Modules\Identity\Application\Actions;

use App\Modules\Audit\Application\Services\AuditLogger;
use App\Modules\Audit\Domain\Enums\AuditAction;
use App\Modules\Identity\Domain\Enums\Role as RoleEnum;
use App\Modules\Identity\Infrastructure\Models\Role;
use App\Modules\Identity\Infrastructure\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;

/** Sync a user's roles (audit `change_permissions`). Only super admins may grant/revoke super_admin. */
class AssignRoles
{
    public function __construct(private readonly AuditLogger $audit) {}

    /** @param  list<string>  $roles */
    public function __invoke(User $target, array $roles, User $actor): User
    {
        $roles = array_values(array_unique($roles));
        $before = $target->roleNames();

        $touchesSuper = in_array(RoleEnum::SuperAdmin->value, $roles, true) xor in_array(RoleEnum::SuperAdmin->value, $before, true);
        if ($touchesSuper && ! $actor->isSuperAdmin()) {
            throw new AuthorizationException('Only a super admin can grant or revoke super_admin.');
        }
        if ($target->is($actor) && in_array(RoleEnum::SuperAdmin->value, $before, true) && ! in_array(RoleEnum::SuperAdmin->value, $roles, true)) {
            throw ValidationException::withMessages(['roles' => ['You cannot remove your own super_admin role.']]);
        }

        $ids = Role::query()->whereIn('name', $roles)->pluck('id')->all();
        $target->roles()->sync($ids);
        $target->flushPermissionCache();
        $target->load('roles');

        $this->audit->log(AuditAction::ChangePermissions, $target, ['before' => ['roles' => $before], 'after' => ['roles' => $target->roleNames()]]);

        return $target;
    }
}

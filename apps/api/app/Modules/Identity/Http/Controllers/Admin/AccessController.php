<?php

namespace App\Modules\Identity\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Modules\Audit\Application\Services\AuditLogger;
use App\Modules\Audit\Domain\Enums\AuditAction;
use App\Modules\Identity\Application\Actions\AssignRoles;
use App\Modules\Identity\Domain\Enums\Role as RoleEnum;
use App\Modules\Identity\Domain\PermissionMatrix;
use App\Modules\Identity\Http\Resources\RoleAdminResource;
use App\Modules\Identity\Http\Resources\UserAdminResource;
use App\Modules\Identity\Infrastructure\Models\Permission;
use App\Modules\Identity\Infrastructure\Models\Role;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Support\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/** PUT /users/{id}/roles · POST /users/{id}/unlock · PUT /roles/{id}/permissions · GET /permissions */
class AccessController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function setRoles(Request $request, int $id, AssignRoles $assign, UserAdminResource $resource): JsonResponse
    {
        abort_unless($request->user()->can('users.update') && $request->user()->can('roles.view'), 403, 'Forbidden.');
        $data = $request->validate(['roles' => ['present', 'array', 'max:20'], 'roles.*' => ['string', 'distinct', Rule::exists('roles', 'name')]]);
        $user = User::query()->findOrFail($id);

        $assign($user, $data['roles'], $request->user());

        return ApiResponse::data($resource->present($user->refresh()->load('roles')));
    }

    public function unlock(Request $request, int $id): JsonResponse
    {
        abort_unless($request->user()->can('users.update'), 403, 'Forbidden.');
        $user = User::query()->findOrFail($id);
        $user->forceFill(['locked_until' => null, 'failed_login_attempts' => 0])->saveQuietly();
        $this->audit->log(AuditAction::Update, $user, ['after' => ['unlocked' => true]]);

        return ApiResponse::noContent();
    }

    public function setPermissions(Request $request, int $id, RoleAdminResource $resource): JsonResponse
    {
        abort_unless($request->user()->can('roles.update'), 403, 'Forbidden.');
        $data = $request->validate(['permissions' => ['present', 'array', 'max:300'], 'permissions.*' => ['string', 'distinct', Rule::in(PermissionMatrix::all())]]);
        $role = Role::query()->findOrFail($id);
        abort_if($role->name === RoleEnum::SuperAdmin->value, 422, 'super_admin always has every permission.');

        $before = $role->permissions()->pluck('name')->sort()->values()->all();
        DB::transaction(fn () => $role->permissions()->sync(Permission::query()->whereIn('name', $data['permissions'])->pluck('id')->all()));
        $after = $role->permissions()->pluck('name')->sort()->values()->all();

        $this->audit->log(AuditAction::ChangePermissions, $role, [
            'before' => ['permissions' => $before],
            'after' => ['permissions' => $after],
        ]);

        return ApiResponse::data($resource->present($role->refresh()->load('permissions')));
    }

    /** All permissions grouped by resource (`PermissionGroup[]`). */
    public function permissions(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('roles.view'), 403, 'Forbidden.');

        return ApiResponse::data(array_map(
            fn (string $resource, array $abilities) => ['resource' => $resource, 'abilities' => $abilities],
            array_keys(PermissionMatrix::RESOURCES),
            array_values(PermissionMatrix::RESOURCES),
        ));
    }
}

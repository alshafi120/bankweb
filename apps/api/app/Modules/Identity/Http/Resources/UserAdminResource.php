<?php

namespace App\Modules\Identity\Http\Resources;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Support\Admin\AdminResource;
use App\Support\Admin\Field;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * Users (`AdminUserRecord`). Roles change only through PUT /users/{id}/roles (audited as
 * change_permissions). status ⇄ is_active (active/inactive). Passwords are never returned.
 */
class UserAdminResource extends AdminResource
{
    public function key(): string
    {
        return 'users';
    }

    public function model(): string
    {
        return User::class;
    }

    public function with(): array
    {
        return ['roles'];
    }

    public function statuses(): array
    {
        return []; // handled through isActive / status mapping below
    }

    public function fields(): array
    {
        return [
            'name' => Field::string('name', true, 120),
            'username' => Field::string('username', true, 60),
            'email' => Field::string('email', true, 190),
            'isActive' => Field::bool('is_active'),
        ];
    }

    public function extraRules(bool $creating, ?Model $model): array
    {
        return [
            'username' => [$creating ? 'required' : 'sometimes', 'string', 'min:3', 'max:60', 'regex:/^[a-z0-9._-]+$/i', Rule::unique('users', 'username')->ignore($model?->getKey())],
            'email' => [$creating ? 'required' : 'sometimes', 'string', 'email:rfc', 'max:190', Rule::unique('users', 'email')->ignore($model?->getKey())],
            'password' => [$creating ? 'required' : 'sometimes', 'string', 'max:255', Password::defaults()],
            'status' => ['sometimes', 'in:active,inactive'],
            'roles' => ['sometimes', 'array'],
            'roles.*' => ['string', 'exists:roles,name'],
        ];
    }

    public function fill(Model $model, array $data, User $user, bool $creating): void
    {
        parent::fill($model, $data, $user, $creating);
        if (array_key_exists('status', $data)) {
            $model->setAttribute('is_active', $data['status'] === 'active');
        }
        if (isset($data['email'])) {
            $model->setAttribute('email', mb_strtolower($data['email']));
        }
        if (! empty($data['password'])) {
            $model->setAttribute('password', $data['password']);
            $model->setAttribute('password_changed_at', now());
        }
        if ($creating && ! array_key_exists('isActive', $data) && ! array_key_exists('status', $data)) {
            $model->setAttribute('is_active', true);
        }
    }

    public function afterSave(Model $model, array $data, User $user, bool $creating): void
    {
        // The admin form sends `roles` with every save; only an actual change is applied
        // (AssignRoles enforces super_admin rules and audits change_permissions).
        if (! isset($data['roles'])) {
            return;
        }
        /** @var User $model */
        $current = $model->roleNames();
        $wanted = array_values(array_unique($data['roles']));
        sort($current);
        sort($wanted);
        if ($creating || $current !== $wanted) {
            app(\App\Modules\Identity\Application\Actions\AssignRoles::class)($model, $wanted, $user);
        }
    }

    public function searchable(): array
    {
        return ['name', 'username', 'email'];
    }

    public function filters(): array
    {
        return [
            'role' => fn ($q, $v) => $q->whereHas('roles', fn ($r) => $r->where('name', $v)),
            'isActive' => fn ($q, $v) => $q->where('is_active', filter_var($v, FILTER_VALIDATE_BOOL)),
        ];
    }

    public function sorts(): array
    {
        return parent::sorts() + ['name' => 'name', 'lastLoginAt' => 'last_login_at'];
    }

    public function bulkStatus(string $action): ?string
    {
        return null;
    }

    public function deleteBlockedReason(Model $model, User $user): ?string
    {
        if ($model->is($user)) {
            return 'You cannot delete your own account.';
        }
        if ($model->isSuperAdmin() && User::query()->whereHas('roles', fn ($q) => $q->where('name', 'super_admin'))->count() <= 1) {
            return 'The last super admin cannot be deleted.';
        }

        return null;
    }

    public function present(Model $model): array
    {
        /** @var User $model */
        return AdminUserResource::make($model, true) + ['status' => $model->is_active ? 'active' : 'inactive', 'updatedAt' => $model->updated_at?->toIso8601String()];
    }
}

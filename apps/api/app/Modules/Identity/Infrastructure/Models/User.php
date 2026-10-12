<?php

namespace App\Modules\Identity\Infrastructure\Models;

use App\Modules\Audit\Infrastructure\Concerns\Auditable;
use App\Modules\Identity\Domain\Enums\Role as RoleEnum;
use Database\Factories\UserFactory;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Admin / CMS user. The public website has no user accounts (internet banking is an external portal).
 *
 * @property int $id
 * @property string $name
 * @property string $username
 * @property string $email
 * @property bool $is_active
 * @property ?string $two_factor_secret
 * @property ?array $two_factor_recovery_codes
 * @property ?\Illuminate\Support\Carbon $two_factor_confirmed_at
 * @property int $failed_login_attempts
 * @property ?\Illuminate\Support\Carbon $locked_until
 * @property ?\Illuminate\Support\Carbon $last_login_at
 */
class User extends Authenticatable implements CanResetPasswordContract
{
    use Auditable, CanResetPassword, HasApiTokens, HasFactory, Notifiable;

    protected $fillable = ['name', 'username', 'email', 'password', 'is_active'];

    protected $hidden = ['password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes'];

    /** @var list<string>|null request-level cache */
    private ?array $permissionCache = null;

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_active' => 'boolean',
            'two_factor_secret' => 'encrypted',
            'two_factor_recovery_codes' => 'encrypted:array',
            'two_factor_confirmed_at' => 'datetime',
            'failed_login_attempts' => 'integer',
            'locked_until' => 'datetime',
            'last_login_at' => 'datetime',
            'password_changed_at' => 'datetime',
        ];
    }

    protected static function newFactory(): UserFactory
    {
        return UserFactory::new();
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }

    /** @return list<string> */
    public function roleNames(): array
    {
        return $this->roles->pluck('name')->values()->all();
    }

    public function hasRole(string|RoleEnum $role): bool
    {
        $name = $role instanceof RoleEnum ? $role->value : $role;

        return in_array($name, $this->roleNames(), true);
    }

    /** @param  list<string>  $roles */
    public function hasAnyRole(array $roles): bool
    {
        return array_intersect($roles, $this->roleNames()) !== [];
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole(RoleEnum::SuperAdmin);
    }

    /** @return list<string> */
    public function permissionNames(): array
    {
        if ($this->isSuperAdmin()) {
            return Permission::query()->orderBy('name')->pluck('name')->all();
        }

        return $this->permissionCache ??= $this->roles()
            ->with('permissions:id,name')
            ->get()
            ->flatMap(fn (Role $role) => $role->permissions->pluck('name'))
            ->unique()->sort()->values()->all();
    }

    public function hasPermission(string $permission): bool
    {
        return $this->isSuperAdmin() || in_array($permission, $this->permissionNames(), true);
    }

    public function flushPermissionCache(): void
    {
        $this->permissionCache = null;
        $this->unsetRelation('roles');
    }

    public function hasTwoFactorEnabled(): bool
    {
        return $this->two_factor_secret !== null && $this->two_factor_confirmed_at !== null;
    }

    public function isLocked(): bool
    {
        return $this->locked_until !== null && $this->locked_until->isFuture();
    }

    public function auditLabel(): string
    {
        return $this->name;
    }
}

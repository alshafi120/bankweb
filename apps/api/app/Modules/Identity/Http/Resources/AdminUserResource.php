<?php

namespace App\Modules\Identity\Http\Resources;

use App\Modules\Identity\Infrastructure\Models\User;

/** Contract `AdminUser` (+ `lockedUntil`, `failedLoginAttempts` for the users screen). */
final class AdminUserResource
{
    public static function make(User $user, bool $withSecurity = false): array
    {
        $out = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'username' => $user->username,
            'roles' => $user->roleNames(),
            'permissions' => $user->permissionNames(),
            'twoFactorEnabled' => $user->hasTwoFactorEnabled(),
            'isActive' => (bool) $user->is_active,
            'lastLoginAt' => $user->last_login_at?->toIso8601String(),
            'createdAt' => $user->created_at?->toIso8601String(),
        ];

        if ($withSecurity) {
            $out['lockedUntil'] = $user->isLocked() ? $user->locked_until?->toIso8601String() : null;
            $out['failedLoginAttempts'] = (int) $user->failed_login_attempts;
        }

        return $out;
    }
}

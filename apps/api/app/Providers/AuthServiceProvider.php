<?php

namespace App\Providers;

use App\Modules\Identity\Infrastructure\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

/**
 * Authorization = one permission resolver for every "<resource>.<ability>" string
 * (roles ↔ permissions, docs/API.md matrix) + Gate::before granting everything to super_admin.
 * Rules that permissions cannot express (Maker/Checker: an author never approves or publishes
 * their own news) are domain rules enforced in App\Modules\News\Application\Actions\NewsWorkflow,
 * and they apply to super_admin too.
 */
class AuthServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Gate::before(function (User $user, string $ability) {
            if (! $user->is_active || $user->isLocked()) {
                return false;
            }

            return $user->isSuperAdmin() ? true : null;
        });

        Gate::after(function (User $user, string $ability, ?bool $result) {
            if ($result !== null || ! str_contains($ability, '.')) {
                return $result;
            }

            return $user->hasPermission($ability);
        });
    }
}

<?php

namespace Database\Seeders;

use App\Modules\Identity\Domain\Enums\Role as RoleEnum;
use App\Modules\Identity\Domain\PermissionMatrix;
use App\Modules\Identity\Infrastructure\Models\Permission;
use App\Modules\Identity\Infrastructure\Models\Role;
use Illuminate\Database\Seeder;

/** The nine built-in roles with the exact default matrix of docs/API.md (idempotent, resets matrix). */
class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $ids = Permission::query()->pluck('id', 'name');

        foreach (RoleEnum::cases() as $case) {
            $label = $case->label();
            $role = Role::query()->updateOrCreate(['name' => $case->value], ['label_ar' => $label['ar'], 'label_en' => $label['en']]);
            // super_admin is granted everything by Gate::before; it also holds all permissions for display.
            $role->permissions()->sync(collect(PermissionMatrix::forRole($case))->map(fn ($p) => $ids[$p] ?? null)->filter()->values()->all());
        }
    }
}

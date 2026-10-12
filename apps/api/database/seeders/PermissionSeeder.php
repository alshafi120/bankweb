<?php

namespace Database\Seeders;

use App\Modules\Identity\Domain\PermissionMatrix;
use App\Modules\Identity\Infrastructure\Models\Permission;
use Illuminate\Database\Seeder;

/** Every "<resource>.<ability>" from docs/API.md (idempotent). */
class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        foreach (PermissionMatrix::all() as $name) {
            [$resource, $ability] = explode('.', $name, 2);
            Permission::query()->updateOrCreate(['name' => $name], ['resource' => $resource, 'ability' => $ability]);
        }
        Permission::query()->whereNotIn('name', PermissionMatrix::all())->delete();
    }
}

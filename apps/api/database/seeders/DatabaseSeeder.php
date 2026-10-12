<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * php artisan migrate --seed
 *  - always: permissions, roles, settings/menus/cities and demo CMS content (fictional bank)
 *  - admin:  only when ADMIN_EMAIL is set (refuses weak/missing ADMIN_PASSWORD)
 *  - local:  one demo user per role (DEMO_USERS_PASSWORD) + demo requests and 30 days of analytics
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([PermissionSeeder::class, RoleSeeder::class]);

        if (filled(env('ADMIN_EMAIL'))) {
            $this->call(AdminUserSeeder::class);
        } else {
            $this->command?->warn('ADMIN_EMAIL not set: skipping AdminUserSeeder (see README → "Creating the first admin").');
        }

        $this->call(DemoContentSeeder::class);

        if (app()->environment('local')) {
            $this->call([DemoUsersSeeder::class, DemoActivitySeeder::class]);
        }
    }
}

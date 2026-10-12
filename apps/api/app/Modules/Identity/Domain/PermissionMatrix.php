<?php

namespace App\Modules\Identity\Domain;

use App\Modules\Identity\Domain\Enums\Role;

/**
 * Single source for permissions (`<resource>.<ability>`) and the default role matrix (docs/API.md §2).
 * Mirrors apps/admin/src/lib/rbac.ts; the server is the authority.
 */
final class PermissionMatrix
{
    private const CRUDP = ['view', 'create', 'update', 'delete', 'publish'];

    private const ALL = ['view', 'create', 'update', 'delete', 'publish', 'approve', 'export'];

    /** Abilities that make sense per resource. */
    public const RESOURCES = [
        'dashboard' => ['view'],
        'pages' => ['view', 'create', 'update', 'delete', 'publish', 'approve'],
        'news' => ['view', 'create', 'update', 'delete', 'publish', 'approve'],
        'news-categories' => ['view', 'create', 'update', 'delete'],
        'services' => self::CRUDP,
        'products' => self::CRUDP,
        'financing-products' => self::CRUDP,
        'cards' => self::CRUDP,
        'offers' => self::CRUDP,
        'banners' => self::CRUDP,
        'faqs' => self::CRUDP,
        'menus' => self::CRUDP,
        'seo' => ['view', 'create', 'update', 'delete'],
        'branches' => self::CRUDP,
        'atms' => self::CRUDP,
        'agents' => self::CRUDP,
        'jobs' => ['view', 'create', 'update', 'delete', 'publish', 'export'],
        'media' => ['view', 'create', 'update', 'delete'],
        'applications' => ['view', 'update', 'export'],
        'contact-requests' => ['view', 'update', 'export'],
        'complaints' => ['view', 'update', 'export'],
        'job-applications' => ['view', 'update', 'export'],
        'users' => ['view', 'create', 'update', 'delete'],
        'roles' => ['view', 'create', 'update', 'delete'],
        'settings' => ['view', 'update'],
        'audit-logs' => ['view', 'export'],
    ];

    /** @return list<string> */
    public static function all(): array
    {
        $out = [];
        foreach (self::RESOURCES as $resource => $abilities) {
            foreach ($abilities as $ability) {
                $out[] = "{$resource}.{$ability}";
            }
        }

        return $out;
    }

    /** @return list<string> */
    public static function forRole(Role $role): array
    {
        $perms = match ($role) {
            Role::SuperAdmin => self::all(),
            Role::ContentManager => [
                ...self::grant(['pages', 'services', 'products', 'financing-products', 'cards', 'faqs', 'menus', 'media', 'banners', 'seo'], self::CRUDP),
                'settings.view', 'dashboard.view',
            ],
            Role::NewsManager => [...self::grant(['news', 'news-categories', 'media'], [...self::CRUDP, 'approve']), 'dashboard.view'],
            Role::MarketingManager => [...self::grant(['offers', 'banners', 'media', 'seo'], self::ALL), 'news.view', 'news.create', 'news.update', 'dashboard.view'],
            Role::HrManager => [...self::grant(['jobs'], self::ALL), 'job-applications.view', 'job-applications.update', 'job-applications.export', 'dashboard.view'],
            Role::BranchManager => [...self::grant(['branches', 'atms', 'agents'], self::ALL), 'dashboard.view'],
            Role::CustomerService => [...self::grant(['applications', 'contact-requests', 'complaints'], ['view', 'update']), 'dashboard.view'],
            Role::Reviewer => ['news.view', 'news.approve', 'pages.view', 'pages.approve', 'dashboard.view'],
            Role::Viewer => array_map(
                fn (string $r) => "{$r}.view",
                array_values(array_diff(array_keys(self::RESOURCES), ['users', 'roles', 'audit-logs', 'settings'])),
            ),
        };

        return array_values(array_unique($perms));
    }

    /**
     * @param  list<string>  $resources
     * @param  list<string>  $abilities
     * @return list<string>
     */
    private static function grant(array $resources, array $abilities): array
    {
        $out = [];
        foreach ($resources as $resource) {
            foreach (array_intersect($abilities, self::RESOURCES[$resource] ?? []) as $ability) {
                $out[] = "{$resource}.{$ability}";
            }
        }

        return $out;
    }
}

<?php

namespace App\Support\Admin;

use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/** Registered generic admin resources (key → definition). */
final class ResourceRegistry
{
    /** @var list<class-string<AdminResource>> */
    public const RESOURCES = [
        \App\Modules\Content\Http\Resources\PageAdminResource::class,
        \App\Modules\News\Http\Resources\NewsAdminResource::class,
        \App\Modules\News\Http\Resources\NewsCategoryAdminResource::class,
        \App\Modules\Catalog\Http\Resources\ServiceAdminResource::class,
        \App\Modules\Catalog\Http\Resources\ProductAdminResource::class,
        \App\Modules\Catalog\Http\Resources\FinancingProductAdminResource::class,
        \App\Modules\Catalog\Http\Resources\CardAdminResource::class,
        \App\Modules\Catalog\Http\Resources\OfferAdminResource::class,
        \App\Modules\Content\Http\Resources\BannerAdminResource::class,
        \App\Modules\Content\Http\Resources\FaqAdminResource::class,
        \App\Modules\Content\Http\Resources\FaqCategoryAdminResource::class,
        \App\Modules\Content\Http\Resources\MenuAdminResource::class,
        \App\Modules\Network\Http\Resources\BranchAdminResource::class,
        \App\Modules\Network\Http\Resources\AtmAdminResource::class,
        \App\Modules\Network\Http\Resources\AgentAdminResource::class,
        \App\Modules\Network\Http\Resources\CityAdminResource::class,
        \App\Modules\Careers\Http\Resources\JobAdminResource::class,
        \App\Modules\Identity\Http\Resources\UserAdminResource::class,
        \App\Modules\Identity\Http\Resources\RoleAdminResource::class,
    ];

    /** @var array<string, AdminResource>|null */
    private ?array $map = null;

    public function get(string $key): AdminResource
    {
        return $this->all()[$key] ?? throw new NotFoundHttpException;
    }

    /** @return array<string, AdminResource> */
    public function all(): array
    {
        if ($this->map === null) {
            $this->map = [];
            foreach (self::RESOURCES as $class) {
                $resource = app($class);
                $this->map[$resource->key()] = $resource;
            }
        }

        return $this->map;
    }

    /** Regex for the {resource} route parameter. */
    public static function pattern(): string
    {
        $keys = array_map(fn (string $class) => (new \ReflectionClass($class))->newInstanceWithoutConstructor()->key(), self::RESOURCES);

        return implode('|', array_map(fn ($k) => preg_quote($k, '/'), $keys));
    }
}

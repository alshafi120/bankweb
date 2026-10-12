<?php

namespace App\Modules\Content\Infrastructure\Models;

use App\Modules\Audit\Infrastructure\Concerns\Auditable;
use App\Support\Content\InvalidatesContentCache;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Menu extends Model
{
    use Auditable, InvalidatesContentCache;

    protected $fillable = ['location', 'name'];

    public function items(): HasMany
    {
        return $this->hasMany(MenuItem::class)->orderBy('position')->orderBy('id');
    }

    /** Nested contract `MenuItem[]` (visible only when $publicOnly). */
    public function tree(bool $publicOnly = true): array
    {
        $items = $this->items()->when($publicOnly, fn ($q) => $q->where('is_visible', true))->get();
        $byParent = $items->groupBy(fn (MenuItem $i) => (int) $i->parent_id);

        $build = function (int $parentId) use (&$build, $byParent, $publicOnly): array {
            return ($byParent[$parentId] ?? collect())->map(function (MenuItem $item) use ($build, $publicOnly) {
                $node = ['id' => $item->id, 'label' => $item->localized('label'), 'href' => $item->href];
                if (! $publicOnly) {
                    $node['isVisible'] = (bool) $item->is_visible;
                }
                $children = $build($item->id);
                if ($children !== []) {
                    $node['children'] = $children;
                }

                return $node;
            })->values()->all();
        };

        return $build(0);
    }

    public function revalidationTags(): array
    {
        return ['menus'];
    }
}

<?php

namespace App\Modules\Content\Http\Resources;

use App\Modules\Content\Infrastructure\Models\Menu;
use App\Modules\Content\Infrastructure\Models\MenuItem;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Support\Admin\AdminResource;
use App\Support\Admin\Field;
use Illuminate\Database\Eloquent\Model;

/** `AdminMenu`: items are nested inside the resource and replaced as a whole on save (max depth 2). */
class MenuAdminResource extends AdminResource
{
    public function key(): string
    {
        return 'menus';
    }

    public function model(): string
    {
        return Menu::class;
    }

    public function statuses(): array
    {
        return [];
    }

    public function fields(): array
    {
        return [
            'location' => Field::enum('location', ['header', 'footer']),
            'name' => Field::string('name', true, 120),
        ];
    }

    public function extraRules(bool $creating, ?Model $model): array
    {
        $item = fn (string $p) => [
            "{$p}.label" => ['required', 'array:ar,en'],
            "{$p}.label.ar" => ['required', 'string', 'max:120'],
            "{$p}.label.en" => ['required', 'string', 'max:120'],
            "{$p}.href" => ['required', 'string', 'max:255', 'regex:#^(https?://|/|\#)#i'],
            "{$p}.isVisible" => ['sometimes', 'boolean'],
        ];

        return [
            'location' => [$creating ? 'required' : 'sometimes', 'in:header,footer', \Illuminate\Validation\Rule::unique('menus', 'location')->ignore($model?->getKey())],
            'items' => ['sometimes', 'array', 'max:50'],
            ...$item('items.*'),
            'items.*.children' => ['sometimes', 'array', 'max:30'],
            ...$item('items.*.children.*'),
        ];
    }

    public function afterSave(Model $model, array $data, User $user, bool $creating): void
    {
        if (! array_key_exists('items', $data)) {
            return;
        }
        /** @var Menu $model */
        $model->items()->delete();
        foreach (array_values($data['items']) as $i => $item) {
            $parent = $this->createItem($model, $item, $i + 1, null);
            foreach (array_values($item['children'] ?? []) as $j => $child) {
                $this->createItem($model, $child, $j + 1, $parent->id);
            }
        }
        $model->touch();
    }

    private function createItem(Menu $menu, array $item, int $position, ?int $parentId): MenuItem
    {
        return $menu->items()->create([
            'parent_id' => $parentId,
            'label_ar' => $item['label']['ar'],
            'label_en' => $item['label']['en'],
            'href' => $item['href'],
            'position' => $position,
            'is_visible' => (bool) ($item['isVisible'] ?? true),
        ]);
    }

    protected function extend(Model $model, array $out): array
    {
        /** @var Menu $model */
        $out['items'] = $model->tree(false);

        return $out;
    }
}

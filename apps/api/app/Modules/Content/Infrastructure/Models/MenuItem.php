<?php

namespace App\Modules\Content\Infrastructure\Models;

use App\Support\Concerns\HasLocalizedAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MenuItem extends Model
{
    use HasLocalizedAttributes;

    protected $fillable = ['menu_id', 'parent_id', 'label_ar', 'label_en', 'href', 'position', 'is_visible'];

    protected function casts(): array
    {
        return ['is_visible' => 'boolean', 'position' => 'integer'];
    }

    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class);
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }
}

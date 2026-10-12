<?php

namespace App\Modules\Content\Infrastructure\Models;

use App\Modules\Audit\Infrastructure\Concerns\Auditable;
use App\Support\Content\InvalidatesContentCache;
use Illuminate\Database\Eloquent\Model;

/** Key/value site settings (value is JSON: strings, Localized objects, nested objects). */
class Setting extends Model
{
    use Auditable, InvalidatesContentCache;

    protected $fillable = ['key', 'value', 'group'];

    protected function casts(): array
    {
        return ['value' => 'json'];
    }

    public function revalidationTags(): array
    {
        return ['settings', 'home'];
    }

    public function auditLabel(): string
    {
        return $this->key;
    }
}

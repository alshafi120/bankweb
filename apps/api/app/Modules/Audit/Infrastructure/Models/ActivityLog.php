<?php

namespace App\Modules\Audit\Infrastructure\Models;

use Illuminate\Database\Eloquent\Model;

/** Non-security activity (previews, draft exports …). */
class ActivityLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['user_id', 'description', 'properties'];

    protected function casts(): array
    {
        return ['properties' => 'array', 'created_at' => 'datetime'];
    }
}

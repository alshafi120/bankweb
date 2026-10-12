<?php

namespace App\Modules\Identity\Infrastructure\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model
{
    protected $fillable = ['name', 'resource', 'ability'];

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }
}

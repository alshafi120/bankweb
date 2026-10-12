<?php

namespace App\Modules\Analytics\Infrastructure\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceView extends Model
{
    public $timestamps = false;

    protected $fillable = ['date', 'service_key', 'count'];

    protected function casts(): array
    {
        return ['date' => 'date', 'count' => 'integer'];
    }
}

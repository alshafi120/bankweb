<?php

namespace App\Modules\Analytics\Infrastructure\Models;

use Illuminate\Database\Eloquent\Model;

/** Cookieless page view; visitor_hash = HMAC(IP + UA + daily salt). */
class PageView extends Model
{
    public $timestamps = false;

    protected $fillable = ['date', 'path', 'referrer_host', 'source', 'visitor_hash'];

    protected function casts(): array
    {
        return ['date' => 'date'];
    }
}

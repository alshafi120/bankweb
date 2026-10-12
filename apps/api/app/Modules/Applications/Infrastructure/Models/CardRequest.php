<?php

namespace App\Modules\Applications\Infrastructure\Models;

use App\Modules\Catalog\Infrastructure\Models\Card;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CardRequest extends Model
{
    protected $fillable = ['application_id', 'card_id', 'has_account', 'account_last4'];

    protected function casts(): array
    {
        return ['has_account' => 'boolean'];
    }

    public function card(): BelongsTo
    {
        return $this->belongsTo(Card::class)->withTrashed();
    }
}

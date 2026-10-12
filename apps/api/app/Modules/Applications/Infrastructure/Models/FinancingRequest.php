<?php

namespace App\Modules\Applications\Infrastructure\Models;

use App\Modules\Catalog\Infrastructure\Models\FinancingProduct;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinancingRequest extends Model
{
    protected $fillable = ['application_id', 'financing_product_id', 'amount', 'months', 'monthly_income', 'employer', 'notes'];

    protected function casts(): array
    {
        return ['amount' => 'integer', 'months' => 'integer', 'monthly_income' => 'integer'];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(FinancingProduct::class, 'financing_product_id')->withTrashed();
    }
}

<?php

namespace App\Modules\Catalog\Infrastructure\Models;

use App\Modules\Audit\Infrastructure\Concerns\Auditable;
use App\Support\Casts\SanitizedHtml;
use App\Support\Concerns\HasLocalizedAttributes;
use App\Support\Concerns\HasPosition;
use App\Support\Concerns\HasSeo;
use App\Support\Concerns\HasStatus;
use App\Support\Concerns\Sluggable;
use App\Support\Concerns\TracksAuthors;
use App\Support\Content\InvalidatesContentCache;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class FinancingProduct extends Model
{
    use Auditable, HasLocalizedAttributes, HasPosition, HasSeo, HasStatus, InvalidatesContentCache, Sluggable, SoftDeletes, TracksAuthors;

    protected $fillable = [
        'slug', 'name_ar', 'name_en', 'summary_ar', 'summary_en', 'body_ar', 'body_en', 'max_amount', 'max_months',
        'annual_profit_rate', 'requirements_ar', 'requirements_en', 'position', 'status',
    ];

    protected function casts(): array
    {
        return [
            'requirements_ar' => 'array', 'requirements_en' => 'array', 'max_amount' => 'integer', 'max_months' => 'integer',
            'annual_profit_rate' => 'float', 'position' => 'integer',
            'body_ar' => SanitizedHtml::class, 'body_en' => SanitizedHtml::class,
        ];
    }

    public function auditResourceType(): string
    {
        return 'financing-products';
    }

    public function revalidationTags(): array
    {
        return ['financing', 'financing:'.$this->slug, 'home'];
    }
}

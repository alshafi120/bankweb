<?php

namespace App\Modules\Content\Infrastructure\Models;

use App\Modules\Audit\Infrastructure\Concerns\Auditable;
use App\Support\Casts\SanitizedHtml;
use App\Support\Concerns\HasLocalizedAttributes;
use App\Support\Concerns\HasPosition;
use App\Support\Concerns\HasStatus;
use App\Support\Concerns\TracksAuthors;
use App\Support\Content\InvalidatesContentCache;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Faq extends Model
{
    use Auditable, HasLocalizedAttributes, HasPosition, HasStatus, InvalidatesContentCache, SoftDeletes, TracksAuthors;

    protected $fillable = ['faq_category_id', 'question_ar', 'question_en', 'answer_ar', 'answer_en', 'is_featured', 'position', 'status'];

    protected function casts(): array
    {
        return [
            'is_featured' => 'boolean',
            'position' => 'integer',
            'answer_ar' => SanitizedHtml::class,
            'answer_en' => SanitizedHtml::class,
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(FaqCategory::class, 'faq_category_id');
    }

    public function auditLabel(): ?string
    {
        return $this->question_ar;
    }

    public function revalidationTags(): array
    {
        return ['faqs', 'home'];
    }
}

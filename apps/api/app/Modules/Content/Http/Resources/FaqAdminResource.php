<?php

namespace App\Modules\Content\Http\Resources;

use App\Modules\Content\Infrastructure\Models\Faq;
use App\Support\Admin\AdminResource;
use App\Support\Admin\Field;

class FaqAdminResource extends AdminResource
{
    public function key(): string
    {
        return 'faqs';
    }

    public function model(): string
    {
        return Faq::class;
    }

    public function fields(): array
    {
        return [
            'categoryId' => Field::fk('faq_category_id', 'faq_categories'),
            'question' => Field::localized('question', true, 500),
            'answer' => Field::html('answer', true),
            'isFeatured' => Field::bool('is_featured'),
        ];
    }

    public function searchable(): array
    {
        return ['question_ar', 'question_en'];
    }

    public function filters(): array
    {
        return ['categoryId' => 'faq_category_id', 'isFeatured' => fn ($q, $v) => $q->where('is_featured', filter_var($v, FILTER_VALIDATE_BOOL))];
    }
}

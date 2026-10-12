<?php

namespace App\Modules\Applications\Http\Requests;

use App\Modules\Catalog\Infrastructure\Models\FinancingProduct;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/** POST /api/v1/applications — `ApplicationInput` (account | financing | card). */
class StoreApplicationRequest extends PublicFormRequest
{
    public function rules(): array
    {
        $v = config('bank.validation');
        $type = $this->input('type');

        $rules = [
            'type' => ['required', 'in:account,financing,card'],
            ...$this->personRules(),
            'nationalId' => ['required', 'string', 'regex:'.$v['national_id']],
            'city' => ['required', 'string', 'min:2', 'max:60'],
            'consent' => ['accepted'],
        ];

        return $rules + match ($type) {
            'account' => [
                'accountType' => ['required', 'in:current,savings,investment,business'],
                'branchId' => ['nullable', 'string', 'max:120', Rule::exists('branches', 'slug')->where('status', 'active')->whereNull('deleted_at')],
            ],
            'financing' => [
                'financingProductId' => ['required', 'string', 'max:120', Rule::exists('financing_products', 'slug')->where('status', 'active')->whereNull('deleted_at')],
                'amount' => ['required', 'integer', 'min:100000', 'max:500000000'],
                'months' => ['required', 'integer', 'min:6', 'max:84'],
                'monthlyIncome' => ['required', 'integer', 'min:1', 'max:10000000000'],
                'employer' => ['nullable', 'string', 'max:120'],
                'notes' => ['nullable', 'string', 'max:'.$v['message_max']],
            ],
            'card' => [
                'cardId' => ['required', 'string', 'max:120', Rule::exists('cards', 'slug')->where('status', 'active')->whereNull('deleted_at')],
                'hasAccount' => ['sometimes', 'boolean'],
                'accountLast4' => ['nullable', 'required_if_accepted:hasAccount', 'string', 'regex:'.$v['account_last4']],
            ],
            default => [],
        };
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty() || $this->input('type') !== 'financing') {
                    return;
                }
                $product = FinancingProduct::query()->where('slug', $this->input('financingProductId'))->first();
                if ($product && (int) $this->input('amount') > $product->max_amount) {
                    $validator->errors()->add('amount', 'The amount exceeds the maximum for this product.');
                }
                if ($product && (int) $this->input('months') > $product->max_months) {
                    $validator->errors()->add('months', 'The term exceeds the maximum for this product.');
                }
            },
            ...parent::after(),
        ];
    }
}

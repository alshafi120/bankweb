<?php

namespace App\Modules\Applications\Http\Requests;

use Illuminate\Validation\Rule;

/** POST /api/v1/complaints — multipart `ComplaintInput` + optional `attachment` (pdf/jpg/png ≤ 5 MB). */
class StoreComplaintRequest extends PublicFormRequest
{
    public function rules(): array
    {
        $v = config('bank.validation');

        return [
            ...$this->personRules(),
            'nationalId' => ['nullable', 'string', 'regex:'.$v['national_id']],
            'category' => ['required', 'in:service,transaction,staff,digital,fees,other'],
            'branchId' => ['nullable', 'string', 'max:120', Rule::exists('branches', 'slug')->whereNull('deleted_at')],
            'transactionDate' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:today'],
            'description' => $this->messageRule(),
            'consent' => ['accepted'],
            // Size/extension pre-check; the real MIME (finfo) check happens in SecureUploadService.
            'attachment' => ['nullable', 'file', 'max:5120', 'extensions:pdf,jpg,jpeg,png'],
        ];
    }
}

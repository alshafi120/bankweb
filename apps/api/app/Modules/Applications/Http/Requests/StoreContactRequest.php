<?php

namespace App\Modules\Applications\Http\Requests;

/** POST /api/v1/contact — `ContactInput` (call-back request). */
class StoreContactRequest extends PublicFormRequest
{
    public function rules(): array
    {
        return [
            ...$this->personRules(),
            'subject' => ['required', 'in:general,accounts,financing,cards,digital,other'],
            'message' => $this->messageRule(),
            'preferredTime' => ['nullable', 'in:morning,afternoon,evening'],
        ];
    }
}

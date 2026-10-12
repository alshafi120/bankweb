<?php

namespace App\Modules\Applications\Http\Requests;

/** POST /api/v1/jobs/{slug}/apply — multipart `JobApplicationInput` + required `cv` (PDF ≤ 5 MB). */
class StoreJobApplicationRequest extends PublicFormRequest
{
    public function rules(): array
    {
        $v = config('bank.validation');

        return [
            ...$this->personRules(emailRequired: true),
            'city' => ['required', 'string', 'min:2', 'max:60'],
            'education' => ['required', 'string', 'min:2', 'max:160'],
            'experienceYears' => ['required', 'integer', 'min:0', 'max:50'],
            'coverLetter' => ['nullable', 'string', 'max:'.$v['message_max']],
            'consent' => ['accepted'],
            'cv' => ['required', 'file', 'max:5120', 'extensions:pdf'],
        ];
    }
}

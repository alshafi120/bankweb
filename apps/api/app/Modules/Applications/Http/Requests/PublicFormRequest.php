<?php

namespace App\Modules\Applications\Http\Requests;

use App\Modules\Applications\Application\Services\TurnstileVerifier;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Base for the public forms. Rules mirror `VALIDATION` in packages/api-types and
 * apps/web/src/lib/forms/validation.ts. Phone / national id: spaces, dashes and brackets are stripped
 * before testing. Turnstile is verified after the field rules (skipped when no secret is configured).
 * The honeypot is handled earlier by the `honeypot` middleware (fake 201, nothing stored).
 */
abstract class PublicFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $merge = [];
        foreach (['phone', 'nationalId'] as $key) {
            if (is_string($this->input($key))) {
                $merge[$key] = preg_replace('/[\s\-()]/u', '', $this->input($key));
            }
        }
        if (is_string($this->input('fullName'))) {
            $merge['fullName'] = trim((string) preg_replace('/\s+/u', ' ', $this->input('fullName')));
        }
        if (is_string($this->input('email'))) {
            $merge['email'] = strtolower(trim($this->input('email'))) ?: null;
        }
        foreach (['amount', 'months', 'monthlyIncome', 'experienceYears'] as $key) {
            if (is_string($this->input($key))) {
                $merge[$key] = str_replace([',', ' '], '', $this->input($key));
            }
        }
        $this->merge($merge);
    }

    /** @return array<string, list<mixed>> */
    protected function personRules(bool $emailRequired = false): array
    {
        $v = config('bank.validation');

        return [
            'fullName' => ['required', 'string', 'min:'.$v['full_name_min'], 'max:'.$v['full_name_max']],
            'phone' => ['required', 'string', 'regex:'.$v['phone']],
            'email' => [$emailRequired ? 'required' : 'nullable', 'string', 'max:160', 'email:rfc'],
            'locale' => ['required', 'in:ar,en'],
            'turnstileToken' => ['nullable', 'string', 'max:4096'],
            'website' => ['nullable', 'string', 'max:0'],
        ];
    }

    /** @return list<string> */
    protected function messageRule(bool $required = true): array
    {
        $v = config('bank.validation');

        return [$required ? 'required' : 'nullable', 'string', 'min:'.$v['message_min'], 'max:'.$v['message_max']];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }
                if (! app(TurnstileVerifier::class)->verify($this->input('turnstileToken'), $this->ip())) {
                    $validator->errors()->add('turnstileToken', 'The verification challenge failed. Please try again.');
                }
            },
        ];
    }

    public function messages(): array
    {
        return [
            'phone.regex' => 'Enter a valid Yemeni mobile number.',
            'nationalId.regex' => 'Enter a valid national ID number (8–12 digits).',
            'accountLast4.regex' => 'Enter the last 4 digits of your account.',
            'consent.accepted' => 'You must accept the terms.',
        ];
    }

    /** Free text is stored as plain text (React escapes on output; no HTML is ever rendered). */
    public function plain(string $key): ?string
    {
        $value = $this->validated($key);

        return $value === null ? null : trim(strip_tags((string) $value));
    }
}

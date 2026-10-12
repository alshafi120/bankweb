<?php

namespace App\Modules\Applications\Application\Actions;

use App\Modules\Applications\Application\Services\ReferenceGenerator;
use App\Modules\Applications\Domain\Enums\ApplicationType;
use App\Modules\Applications\Domain\Events\RequestSubmitted;
use App\Modules\Applications\Infrastructure\Jobs\NotifyStaffOfSubmission;
use App\Modules\Applications\Infrastructure\Models\Application;
use App\Modules\Applications\Infrastructure\Models\Complaint;
use App\Modules\Applications\Infrastructure\Models\ContactRequest;
use App\Modules\Applications\Infrastructure\Models\JobApplication;
use App\Modules\Careers\Infrastructure\Models\Job;
use App\Modules\Catalog\Infrastructure\Models\Card;
use App\Modules\Catalog\Infrastructure\Models\FinancingProduct;
use App\Modules\Integration\Ports\CoreBankingPort;
use App\Modules\Media\Application\Services\SecureUploadService;
use App\Modules\Network\Infrastructure\Models\Branch;
use App\Support\Security\PiiHasher;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

/**
 * Stores a validated public request, issues its reference, and queues the staff notification.
 * Nothing is sent synchronously to any bank system (docs/ARCHITECTURE.md §3).
 */
class SubmitPublicRequest
{
    public function __construct(
        private readonly ReferenceGenerator $references,
        private readonly SecureUploadService $uploads,
        private readonly CoreBankingPort $coreBanking,
    ) {}

    /** @param  array<string, mixed>  $input  validated camelCase input */
    public function application(array $input, ?string $ip, ?string $userAgent): string
    {
        $type = ApplicationType::from($input['type']);

        $application = DB::transaction(function () use ($input, $type, $ip, $userAgent) {
            $application = Application::query()->create([
                'reference' => $this->references->next($type->referencePrefix()),
                'type' => $type->value,
                'status' => 'new',
                'full_name' => $this->text($input['fullName']),
                'national_id' => $input['nationalId'],
                'phone' => PiiHasher::normalizePhone($input['phone']),
                'email' => $input['email'] ?? null,
                'city' => $this->text($input['city']),
                'locale' => $input['locale'],
                'account_type' => $type === ApplicationType::Account ? $input['accountType'] : null,
                'branch_id' => isset($input['branchId']) ? Branch::query()->where('slug', $input['branchId'])->value('id') : null,
                'ip_hash' => PiiHasher::ip($ip),
                'user_agent' => $userAgent ? Str::limit($userAgent, 250, '') : null,
                'submitted_at' => now(),
            ]);

            if ($type === ApplicationType::Financing) {
                $application->financingRequest()->create([
                    'financing_product_id' => FinancingProduct::query()->where('slug', $input['financingProductId'])->value('id'),
                    'amount' => (int) $input['amount'],
                    'months' => (int) $input['months'],
                    'monthly_income' => (int) $input['monthlyIncome'],
                    'employer' => $this->text($input['employer'] ?? null),
                    'notes' => $this->text($input['notes'] ?? null),
                ]);
            }

            if ($type === ApplicationType::Card) {
                $hasAccount = filter_var($input['hasAccount'] ?? false, FILTER_VALIDATE_BOOL);
                $application->cardRequest()->create([
                    'card_id' => Card::query()->where('slug', $input['cardId'])->value('id'),
                    'has_account' => $hasAccount,
                    'account_last4' => $hasAccount ? ($input['accountLast4'] ?? null) : null,
                ]);
            }

            // Outbox intent only (Null adapter in v1). Carries the reference, never PII.
            match ($type) {
                ApplicationType::Account => $this->coreBanking->submitAccountOpeningIntent($application->reference, ['type' => 'account']),
                ApplicationType::Financing => $this->coreBanking->submitFinancingIntent($application->reference, ['type' => 'financing', 'productId' => $input['financingProductId'], 'amount' => (int) $input['amount'], 'months' => (int) $input['months']]),
                ApplicationType::Card => $this->coreBanking->submitCardIntent($application->reference, ['type' => 'card', 'productId' => $input['cardId']]),
            };

            return $application;
        });

        $this->submitted('applications', $application->id, $application->reference, $type->value);

        return $application->reference;
    }

    public function contact(array $input, ?string $ip): string
    {
        $contact = DB::transaction(fn () => ContactRequest::query()->create([
            'reference' => $this->references->next('CB'),
            'status' => 'new',
            'full_name' => $this->text($input['fullName']),
            'phone' => PiiHasher::normalizePhone($input['phone']),
            'email' => $input['email'] ?? null,
            'subject' => $input['subject'],
            'message' => $this->text($input['message']),
            'preferred_time' => $input['preferredTime'] ?? null,
            'locale' => $input['locale'],
            'ip_hash' => PiiHasher::ip($ip),
        ]));

        $this->submitted('contact-requests', $contact->id, $contact->reference, 'contact');

        return $contact->reference;
    }

    public function complaint(array $input, ?UploadedFile $attachment, ?string $ip): string
    {
        // Store the file first (validates real MIME); remove it again if the DB write fails.
        $stored = $attachment
            ? $this->uploads->store($attachment, 'attachment', 'private', 'complaints', SecureUploadService::DOCUMENT_TYPES, (int) config('bank.forms.upload_max_bytes'))
            : null;

        try {
            $complaint = DB::transaction(fn () => Complaint::query()->create([
                'reference' => $this->references->next('CMP'),
                'status' => 'new',
                'full_name' => $this->text($input['fullName']),
                'phone' => PiiHasher::normalizePhone($input['phone']),
                'email' => $input['email'] ?? null,
                'national_id' => $input['nationalId'] ?? null,
                'category' => $input['category'],
                'branch_id' => isset($input['branchId']) ? Branch::query()->where('slug', $input['branchId'])->value('id') : null,
                'transaction_date' => $input['transactionDate'] ?? null,
                'description' => $this->text($input['description']),
                'attachment_path' => $stored['path'] ?? null,
                'locale' => $input['locale'],
                'ip_hash' => PiiHasher::ip($ip),
            ]));
        } catch (Throwable $e) {
            if ($stored) {
                Storage::disk('private')->delete($stored['path']);
            }
            throw $e;
        }

        $this->submitted('complaints', $complaint->id, $complaint->reference, 'complaint');

        return $complaint->reference;
    }

    public function jobApplication(Job $job, array $input, UploadedFile $cv, ?string $ip): string
    {
        $stored = $this->uploads->store($cv, 'cv', 'private', 'cvs', SecureUploadService::PDF_ONLY, (int) config('bank.forms.upload_max_bytes'));

        try {
            $application = DB::transaction(fn () => JobApplication::query()->create([
                'reference' => $this->references->next('JOB'),
                'job_id' => $job->id,
                'status' => 'new',
                'full_name' => $this->text($input['fullName']),
                'phone' => PiiHasher::normalizePhone($input['phone']),
                'email' => $input['email'],
                'city' => $this->text($input['city']),
                'education' => $this->text($input['education']),
                'experience_years' => (int) $input['experienceYears'],
                'cover_letter' => $this->text($input['coverLetter'] ?? null),
                'cv_path' => $stored['path'],
                'locale' => $input['locale'],
                'ip_hash' => PiiHasher::ip($ip),
            ]));
        } catch (Throwable $e) {
            Storage::disk('private')->delete($stored['path']);
            throw $e;
        }

        $this->submitted('job-applications', $application->id, $application->reference, 'job');

        return $application->reference;
    }

    private function submitted(string $kind, int $id, string $reference, string $type): void
    {
        RequestSubmitted::dispatch($kind, $id, $reference, $type);
        NotifyStaffOfSubmission::dispatch($kind, $id)->afterCommit();
    }

    private function text(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $value = trim(strip_tags($value));

        return $value === '' ? null : $value;
    }
}

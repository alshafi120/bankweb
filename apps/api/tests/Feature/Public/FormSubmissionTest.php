<?php

namespace Tests\Feature\Public;

use App\Modules\Applications\Infrastructure\Jobs\NotifyStaffOfSubmission;
use App\Modules\Applications\Infrastructure\Models\Application;
use App\Modules\Applications\Infrastructure\Models\Complaint;
use App\Modules\Applications\Infrastructure\Models\ContactRequest;
use App\Modules\Applications\Infrastructure\Models\JobApplication;
use App\Modules\Careers\Infrastructure\Models\Job;
use App\Modules\Catalog\Infrastructure\Models\Card;
use App\Modules\Catalog\Infrastructure\Models\FinancingProduct;
use App\Modules\Network\Infrastructure\Models\City;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FormSubmissionTest extends TestCase
{
    private const REF = '/^WTQ-%s-\d{4}-\d{6}$/';

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('private');
        Queue::fake();
    }

    private function applicant(array $extra = []): array
    {
        return array_merge([
            'fullName' => 'محمد أحمد علي', 'nationalId' => '01012345678', 'phone' => '+967 77 123 4567',
            'email' => 'm@example.com', 'city' => "Sana'a", 'consent' => true, 'locale' => 'ar', 'website' => '',
        ], $extra);
    }

    private function pdf(string $name = 'file.pdf'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
    }

    public function test_account_application_is_created_with_reference_and_protected_pii(): void
    {
        $res = $this->postJson('/api/v1/applications', $this->applicant(['type' => 'account', 'accountType' => 'savings']))->assertCreated();

        $ref = $res->json('data.reference');
        $this->assertMatchesRegularExpression(sprintf(self::REF, 'ACC'), $ref);
        $app = Application::query()->where('reference', $ref)->firstOrFail();
        $this->assertSame('new', $app->status);
        $this->assertSame('967771234567', $app->phone);               // canonical digits, decrypted by cast
        $raw = \DB::table('applications')->where('id', $app->id)->first();
        $this->assertStringNotContainsString('771234567', (string) $raw->phone);     // encrypted at rest
        $this->assertStringNotContainsString('01012345678', (string) $raw->national_id);
        $this->assertNotNull($raw->phone_hash);
        $this->assertNotNull($raw->ip_hash);
        $this->assertNotSame('127.0.0.1', $raw->ip_hash);
        Queue::assertPushed(NotifyStaffOfSubmission::class);
    }

    public function test_financing_application(): void
    {
        FinancingProduct::query()->create(['slug' => 'personal', 'name_ar' => 'شخصي', 'name_en' => 'Personal', 'max_amount' => 10_000_000, 'max_months' => 60, 'annual_profit_rate' => 8, 'status' => 'active']);

        $res = $this->postJson('/api/v1/applications', $this->applicant([
            'type' => 'financing', 'financingProductId' => 'personal', 'amount' => 1_000_000, 'months' => 24, 'monthlyIncome' => 250_000, 'employer' => 'ACME',
        ]))->assertCreated();

        $this->assertMatchesRegularExpression(sprintf(self::REF, 'FIN'), $res->json('data.reference'));
        $this->assertDatabaseHas('financing_requests', ['amount' => 1_000_000, 'months' => 24]);
    }

    public function test_card_application(): void
    {
        Card::query()->create(['slug' => 'debit', 'name_ar' => 'خصم', 'name_en' => 'Debit', 'network' => 'Visa', 'tone' => 'jade', 'status' => 'active']);

        $res = $this->postJson('/api/v1/applications', $this->applicant(['type' => 'card', 'cardId' => 'debit', 'hasAccount' => true, 'accountLast4' => '1234']))->assertCreated();

        $this->assertMatchesRegularExpression(sprintf(self::REF, 'CRD'), $res->json('data.reference'));
        $this->assertDatabaseHas('card_requests', ['has_account' => true, 'account_last4' => '1234']);
    }

    public function test_contact_request(): void
    {
        $res = $this->postJson('/api/v1/contact', [
            'fullName' => 'محمد أحمد علي', 'phone' => '771234567', 'subject' => 'general', 'preferredTime' => 'morning',
            'message' => 'أرغب في معرفة تفاصيل أكثر عن الخدمة.', 'locale' => 'ar',
        ])->assertCreated();

        $this->assertMatchesRegularExpression(sprintf(self::REF, 'CB'), $res->json('data.reference'));
        $this->assertSame(1, ContactRequest::query()->count());
    }

    public function test_complaint_with_attachment_is_stored_privately(): void
    {
        $res = $this->post('/api/v1/complaints', [
            'fullName' => 'محمد أحمد علي', 'phone' => '771234567', 'category' => 'service', 'consent' => '1', 'locale' => 'ar',
            'description' => 'تأخر تنفيذ حوالة لأكثر من يومين دون إشعار.', 'attachment' => $this->pdf('receipt.pdf'),
        ], ['Accept' => 'application/json'])->assertCreated();

        $this->assertMatchesRegularExpression(sprintf(self::REF, 'CMP'), $res->json('data.reference'));
        $complaint = Complaint::query()->firstOrFail();
        $this->assertNotNull($complaint->attachment_path);
        $this->assertStringNotContainsString('receipt', $complaint->attachment_path);   // random name
        Storage::disk('private')->assertExists($complaint->attachment_path);
    }

    public function test_job_application_with_cv(): void
    {
        $city = City::query()->create(['slug' => 'aden', 'name_ar' => 'عدن', 'name_en' => 'Aden']);
        Job::factory()->create(['slug' => 'teller', 'city_id' => $city->id]);

        $res = $this->post('/api/v1/jobs/teller/apply', [
            'fullName' => 'محمد أحمد علي', 'phone' => '771234567', 'email' => 'cand@example.com', 'city' => 'Aden',
            'education' => 'BSc Accounting', 'experienceYears' => '3', 'consent' => '1', 'locale' => 'en', 'cv' => $this->pdf('cv.pdf'),
        ], ['Accept' => 'application/json'])->assertCreated();

        $this->assertMatchesRegularExpression(sprintf(self::REF, 'JOB'), $res->json('data.reference'));
        Storage::disk('private')->assertExists(JobApplication::query()->firstOrFail()->cv_path);
    }

    public function test_spoofed_upload_mime_is_rejected(): void
    {
        $city = City::query()->create(['slug' => 'aden', 'name_ar' => 'عدن', 'name_en' => 'Aden']);
        Job::factory()->create(['slug' => 'teller', 'city_id' => $city->id]);
        // .pdf name + application/pdf header, but the bytes are a PHP script.
        $fake = UploadedFile::fake()->createWithContent('cv.pdf', "<?php system(\$_GET['c']); ?>");

        $this->post('/api/v1/jobs/teller/apply', [
            'fullName' => 'محمد أحمد علي', 'phone' => '771234567', 'email' => 'cand@example.com', 'city' => 'Aden',
            'education' => 'BSc', 'experienceYears' => '3', 'consent' => '1', 'locale' => 'en', 'cv' => $fake,
        ], ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('cv');

        $this->assertSame(0, JobApplication::query()->count());
        $this->assertSame([], Storage::disk('private')->allFiles());
    }

    public function test_honeypot_returns_fake_success_without_saving(): void
    {
        $res = $this->postJson('/api/v1/applications', $this->applicant(['type' => 'financing', 'website' => 'http://spam.example']))->assertCreated();

        $this->assertMatchesRegularExpression(sprintf(self::REF, 'FIN'), $res->json('data.reference'));
        $this->assertSame(0, Application::query()->count());
        Queue::assertNothingPushed();
    }

    public function test_invalid_yemeni_phone_is_rejected(): void
    {
        foreach (['0551234567', '+966501234567', '761234567', '77123'] as $phone) {
            $this->postJson('/api/v1/applications', $this->applicant(['type' => 'account', 'accountType' => 'current', 'phone' => $phone]))
                ->assertUnprocessable()->assertJsonValidationErrors('phone');
        }
        $this->assertSame(0, Application::query()->count());
    }

    public function test_forms_are_rate_limited_per_ip(): void
    {
        $payload = ['fullName' => 'محمد أحمد علي', 'phone' => '771234567', 'subject' => 'general', 'message' => 'أرغب في معرفة تفاصيل أكثر عن الخدمة.', 'locale' => 'ar'];
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/contact', $payload)->assertCreated();
        }

        $this->postJson('/api/v1/contact', $payload)->assertStatus(429)->assertHeader('Retry-After');
        // Another form has its own bucket.
        $this->postJson('/api/v1/applications', $this->applicant(['type' => 'account', 'accountType' => 'current']))->assertCreated();
    }

    public function test_track_records_a_page_view_without_raw_ip(): void
    {
        $this->postJson('/api/v1/track', ['path' => '/ar/financing', 'referrer' => 'www.google.com'])->assertNoContent();

        $row = \DB::table('page_views')->first();
        $this->assertSame('/ar/financing', $row->path);
        $this->assertSame('search', $row->source);
        $this->assertSame(64, strlen($row->visitor_hash));
    }
}

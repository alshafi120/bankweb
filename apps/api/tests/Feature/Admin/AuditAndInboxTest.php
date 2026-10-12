<?php

namespace Tests\Feature\Admin;

use App\Modules\Applications\Infrastructure\Models\Application;
use App\Modules\Audit\Infrastructure\Models\AuditLog;
use App\Modules\Catalog\Infrastructure\Models\Service;
use App\Modules\Identity\Infrastructure\Models\User;
use Tests\TestCase;

class AuditAndInboxTest extends TestCase
{
    public function test_update_writes_audit_log_with_before_and_after(): void
    {
        $user = $this->actingAsRole('content_manager');
        $service = Service::query()->create(['slug' => 'accounts', 'icon' => 'account', 'title_ar' => 'قديم', 'title_en' => 'Old', 'summary_ar' => 'م', 'summary_en' => 'S', 'href' => '/accounts', 'status' => 'active']);

        $this->admin('PUT', "/services/{$service->id}", ['title' => ['ar' => 'جديد', 'en' => 'New']])->assertOk()->assertJsonPath('data.title.en', 'New');

        $log = AuditLog::query()->where('action', 'update')->where('resource_type', 'services')->latest('id')->firstOrFail();
        $this->assertSame($user->id, $log->user_id);
        $this->assertSame((string) $service->id, (string) $log->resource_id);
        $this->assertSame('Old', $log->changes['before']['title_en']);
        $this->assertSame('New', $log->changes['after']['title_en']);
        $this->assertNotNull($log->ip_address);

        $this->admin('GET', '/audit-logs?filter[action]=update&filter[resourceType]=services')->assertForbidden(); // content_manager lacks audit-logs.view
    }

    public function test_audit_log_is_append_only(): void
    {
        $user = $this->actingAsRole('super_admin');
        app(\App\Modules\Audit\Application\Services\AuditLogger::class)->log(\App\Modules\Audit\Domain\Enums\AuditAction::Login, $user, null, $user->id);
        $log = AuditLog::query()->firstOrFail();

        $this->expectException(\LogicException::class);
        $log->update(['action' => 'delete']);
    }

    public function test_sensitive_keys_are_masked_in_audit_changes(): void
    {
        $this->actingAsRole('super_admin');

        $this->admin('POST', '/users', [
            'name' => 'New Admin', 'username' => 'newadmin', 'email' => 'new@withaq.example',
            'password' => 'Str0ng!Passw0rd#X', 'roles' => ['viewer'], 'isActive' => true,
        ])->assertCreated()->assertJsonMissingPath('data.password');

        $log = AuditLog::query()->where('action', 'create')->where('resource_type', 'users')->firstOrFail();
        $json = json_encode($log->changes);
        $this->assertStringNotContainsString('Str0ng!Passw0rd#X', $json);
        $this->assertStringNotContainsString('$argon2id', $json);
        $this->assertTrue(AuditLog::query()->where('action', 'change_permissions')->exists());
    }

    public function test_inbox_masks_pii_and_hides_raw_values(): void
    {
        $this->actingAsRole('customer_service');
        $app = Application::factory()->create(['phone' => '967771234567', 'national_id' => '01012345678', 'email' => 'person@example.com']);

        $res = $this->admin('GET', "/applications/{$app->id}")->assertOk();

        $res->assertJsonPath('data.phoneMasked', '+967 7•• ••• 567')
            ->assertJsonPath('data.nationalIdMasked', '•••••••5678')
            ->assertJsonStructure(['data' => ['id', 'reference', 'type', 'status', 'fullName', 'phoneMasked', 'nationalIdMasked', 'email', 'city', 'locale', 'assignedTo', 'details', 'notes', 'createdAt', 'updatedAt']]);
        $body = $res->getContent();
        $this->assertStringNotContainsString('771234567', $body);
        $this->assertStringNotContainsString('01012345678', $body);
        $this->assertArrayNotHasKey('phone', $res->json('data'));
        $this->assertArrayNotHasKey('nationalId', $res->json('data'));
    }

    public function test_inbox_status_assign_note_and_export(): void
    {
        $agent = $this->actingAsRole('super_admin');
        $app = Application::factory()->create(['type' => 'financing']);

        $this->admin('PATCH', "/applications/{$app->id}", ['status' => 'in_review', 'assignedTo' => $agent->id])->assertOk()
            ->assertJsonPath('data.status', 'in_review')->assertJsonPath('data.assignedTo.id', $agent->id);
        $this->admin('POST', "/applications/{$app->id}/notes", ['body' => 'Called the customer'])->assertOk()
            ->assertJsonPath('data.notes.0.body', 'Called the customer');

        $csv = $this->withHeaders(['Origin' => self::ADMIN_ORIGIN])->get('/api/admin/v1/applications/export?filter[type]=financing');
        $csv->assertOk();
        $this->assertStringContainsString('text/csv', $csv->headers->get('Content-Type'));
        $content = $csv->streamedContent();
        $this->assertStringContainsString($app->reference, $content);
        $this->assertStringNotContainsString($app->phone, $content);
        $this->assertTrue(AuditLog::query()->where('action', 'export')->exists());
    }

    public function test_customer_service_cannot_export(): void
    {
        $this->actingAsRole('customer_service');

        $this->admin('GET', '/applications/export')->assertForbidden();
    }

    public function test_inactive_user_loses_access(): void
    {
        $user = $this->actingAsRole('viewer');
        $user->forceFill(['is_active' => false])->save();

        $this->admin('GET', '/news')->assertForbidden();
    }
}

<?php

namespace Tests\Feature\Admin;

use App\Modules\Content\Infrastructure\Models\Page;
use Database\Seeders\DemoContentSeeder;
use Tests\TestCase;

class ResourceCrudTest extends TestCase
{
    public function test_list_query_pagination_search_sort_and_filters(): void
    {
        $this->seed(DemoContentSeeder::class);
        $this->actingAsRole('super_admin');

        $res = $this->admin('GET', '/branches?perPage=2&sort=-name')->assertOk();
        $res->assertJsonPath('meta.perPage', 2)->assertJsonCount(2, 'data');

        $this->admin('GET', '/branches?perPage=500')->assertUnprocessable();
        $this->admin('GET', '/branches?filter[cityId]=2')->assertOk()->assertJsonPath('data.0.cityId', 2);
        $this->admin('GET', '/news?search=solar')->assertOk()->assertJsonPath('data.0.slug', 'solar-irrigation-financing-2026');
    }

    public function test_every_registered_resource_round_trips_its_own_shape(): void
    {
        $this->seed(DemoContentSeeder::class);
        $this->actingAsRole('super_admin');

        foreach (['pages', 'news', 'news-categories', 'services', 'products', 'financing-products', 'cards', 'offers', 'banners', 'faqs', 'faq-categories', 'menus', 'branches', 'atms', 'agents', 'jobs', 'cities', 'roles'] as $resource) {
            $record = $this->admin('GET', "/{$resource}?perPage=1")->assertOk()->json('data.0');
            $this->assertNotNull($record, $resource);
            $body = $record;
            unset($body['id'], $body['createdAt'], $body['updatedAt']);
            $this->admin('PUT', "/{$resource}/{$record['id']}", $body)->assertOk();
        }
    }

    public function test_slug_validation_and_uniqueness(): void
    {
        $this->seed(DemoContentSeeder::class);
        $this->actingAsRole('super_admin');

        $this->admin('POST', '/news-categories', ['name' => ['ar' => 'س', 'en' => 'X'], 'slug' => 'Bad Slug!'])->assertUnprocessable()->assertJsonValidationErrors('slug');
        $this->admin('POST', '/news-categories', ['name' => ['ar' => 'س', 'en' => 'X'], 'slug' => 'financing'])->assertUnprocessable()->assertJsonValidationErrors('slug');
        $this->admin('POST', '/news-categories', ['name' => ['ar' => 'س', 'en' => 'X'], 'slug' => 'brand-new'])->assertCreated();
    }

    public function test_bulk_and_reorder(): void
    {
        $this->seed(DemoContentSeeder::class);
        $this->actingAsRole('super_admin');

        $this->admin('POST', '/services/bulk', ['action' => 'deactivate', 'ids' => [1, 2]])->assertOk()->assertJsonPath('data.affected', 2);
        $this->assertSame(0, collect($this->getJson('/api/v1/services')->json('data'))->whereIn('id', ['accounts', 'financing'])->count());

        $this->admin('PATCH', '/services/reorder', ['ids' => [3, 1]])->assertNoContent();
        $this->admin('GET', '/services/3')->assertJsonPath('data.position', 1);
    }

    public function test_page_sections_replace_validates_block_data_and_sanitizes_html(): void
    {
        $this->seed(DemoContentSeeder::class);
        $this->actingAsRole('content_manager');
        $page = Page::query()->where('slug', 'privacy')->firstOrFail();

        $this->admin('PUT', "/pages/{$page->id}/sections", [['id' => -1, 'type' => 'cta', 'data' => ['title' => ['ar' => 'x', 'en' => 'x']], 'isVisible' => true]])
            ->assertUnprocessable()->assertJsonValidationErrors('sections.0.data.primary');
        $this->admin('PUT', "/pages/{$page->id}/sections", [['id' => -1, 'type' => 'home:hero', 'data' => [], 'isVisible' => true]])
            ->assertUnprocessable();

        $res = $this->admin('PUT', "/pages/{$page->id}/sections", [[
            'id' => -1, 'type' => 'text', 'isVisible' => true, 'startsAt' => null, 'endsAt' => null,
            'data' => ['heading' => null, 'body' => ['ar' => '<p>نص<script>alert(1)</script></p>', 'en' => '<p onclick="x()">Hi <a href="javascript:alert(1)">x</a></p>']],
        ]])->assertOk();

        $body = $res->json('data.sections.0.data.body');
        $this->assertStringNotContainsString('<script', $body['ar']);
        $this->assertStringNotContainsString('onclick', $body['en']);
        $this->assertStringNotContainsString('javascript:', $body['en']);
        $this->assertCount(1, $res->json('data.sections'));
    }

    public function test_publish_and_schedule_pages(): void
    {
        $this->seed(DemoContentSeeder::class);
        $this->actingAsRole('content_manager');
        $page = Page::query()->where('slug', 'csr')->firstOrFail();

        $this->admin('POST', "/pages/{$page->id}/schedule", ['publishAt' => now()->subHour()->toIso8601String()])->assertUnprocessable();
        $this->admin('POST', "/pages/{$page->id}/schedule", ['publishAt' => now()->addHour()->toIso8601String()])->assertOk()->assertJsonPath('data.status', 'scheduled');
        $this->getJson('/api/v1/pages/csr')->assertNotFound();

        $this->travel(2)->hours();
        $this->artisan('content:publish-scheduled')->assertSuccessful();
        $this->getJson('/api/v1/pages/csr')->assertOk();
    }

    public function test_settings_partial_update(): void
    {
        $this->seed(DemoContentSeeder::class);
        $this->actingAsRole('super_admin');

        $this->admin('PUT', '/settings', ['phone' => '+967 1 999 999'])->assertOk()->assertJsonPath('data.phone', '+967 1 999 999')
            ->assertJsonPath('data.bankName.en', 'Withaq Bank');
        $this->getJson('/api/v1/settings')->assertJsonPath('data.phone', '+967 1 999 999');
    }

    public function test_dashboard_shape(): void
    {
        $this->actingAsRole('customer_service');

        $this->admin('GET', '/dashboard')->assertOk()->assertJsonStructure(['data' => [
            'kpis' => ['visitors', 'applications', 'accountRequests', 'financingRequests', 'cardRequests', 'complaints', 'news', 'jobs', 'branches'],
            'charts' => ['visits', 'dailyApplications', 'topServices', 'topPages', 'applicationsByCity', 'trafficSources'],
        ]]);
    }
}

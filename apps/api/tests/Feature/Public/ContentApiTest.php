<?php

namespace Tests\Feature\Public;

use App\Modules\Content\Infrastructure\Models\Page;
use App\Modules\Content\Infrastructure\Models\PageSection;
use App\Modules\News\Infrastructure\Models\News;
use Database\Seeders\DemoContentSeeder;
use Tests\TestCase;

class ContentApiTest extends TestCase
{
    /** Keys of `HomeContent` in packages/api-types. */
    private const HOME_KEYS = ['settings', 'services', 'needs', 'accounts', 'financing', 'digital', 'cards', 'stats', 'locations', 'news', 'offers', 'reasons', 'reasonStats', 'faqs'];

    public function test_home_content_matches_the_contract_shape(): void
    {
        $this->seed(DemoContentSeeder::class);

        $res = $this->getJson('/api/v1/pages/home/content')->assertOk();

        $data = $res->json('data');
        foreach (self::HOME_KEYS as $key) {
            $this->assertArrayHasKey($key, $data, "HomeContent.$key missing");
        }
        $res->assertJsonStructure(['data' => [
            'settings' => ['bankName' => ['ar', 'en'], 'phone', 'tollFree', 'email', 'address' => ['ar', 'en'], 'internetBankingUrl',
                'social' => ['facebook', 'instagram', 'x', 'linkedin', 'youtube'], 'appStores' => ['googlePlay', 'appStore']],
            'services' => [['id', 'icon', 'title' => ['ar', 'en'], 'summary' => ['ar', 'en'], 'href']],
            'accounts' => [['id', 'accountType', 'name', 'tagline', 'features' => ['ar', 'en'], 'requirements', 'minimumBalance', 'currency', 'href']],
            'financing' => [['id', 'name', 'summary', 'maxAmount', 'maxMonths', 'annualProfitRate']],
            'cards' => [['id', 'name', 'summary', 'network', 'tone']],
            'stats' => [['id', 'value', 'label' => ['ar', 'en']]],
            'locations' => [['id', 'type', 'name', 'city', 'district', 'address', 'phone', 'hours', 'services', 'lat', 'lng']],
            'news' => [['id', 'slug', 'title', 'excerpt', 'category', 'publishedAt', 'image']],
            'faqs' => [['id', 'question', 'answer']],
        ]]);
        // layout = plain HomeSectionType names of visible home:* sections, in order.
        $layout = $res->json('data.layout');
        $this->assertSame('hero', $layout[0]);
        foreach ($layout as $type) {
            $this->assertStringNotContainsString('home:', $type);
        }
        // Money is integer YER.
        $this->assertIsInt($res->json('data.financing.0.maxAmount'));
    }

    public function test_home_layout_omits_hidden_sections(): void
    {
        $this->seed(DemoContentSeeder::class);
        $home = Page::query()->where('slug', 'home')->firstOrFail();
        $home->sections()->where('type', 'home:offers')->update(['is_visible' => false]);
        \App\Support\Content\ContentCache::bump();

        $layout = $this->getJson('/api/v1/pages/home/content')->assertOk()->json('data.layout');
        $this->assertNotContains('offers', $layout);
        $this->assertContains('services', $layout);
    }

    public function test_cms_page_returns_only_visible_and_currently_scheduled_sections(): void
    {
        $page = Page::factory()->create(['slug' => 'about-test']);
        $mk = fn (array $attrs, int $pos) => PageSection::query()->create(array_merge([
            'page_id' => $page->id, 'type' => 'text', 'position' => $pos, 'is_visible' => true,
            'data' => ['heading' => null, 'body' => ['ar' => '<p>نص</p>', 'en' => '<p>Text '.$pos.'</p>']],
        ], $attrs));
        $visible = $mk([], 1);
        $mk(['is_visible' => false], 2);
        $mk(['starts_at' => now()->addDay()], 3);           // not started yet
        $mk(['ends_at' => now()->subDay()], 4);             // expired
        $live = $mk(['starts_at' => now()->subDay(), 'ends_at' => now()->addDay()], 5);

        $res = $this->getJson('/api/v1/pages/about-test')->assertOk();

        $this->assertSame([$visible->id, $live->id], array_column($res->json('data.sections'), 'id'));
        $res->assertJsonStructure(['data' => ['slug', 'title' => ['ar', 'en'], 'summary', 'seo' => ['title', 'description'], 'sections' => [['id', 'type', 'data']], 'updatedAt']]);
    }

    public function test_unpublished_page_is_not_found(): void
    {
        Page::factory()->create(['slug' => 'draft-page', 'status' => 'draft', 'published_at' => null]);

        $this->getJson('/api/v1/pages/draft-page')->assertNotFound()->assertExactJson(['message' => 'Not found.']);
    }

    public function test_news_lists_only_published_items_with_pagination_meta(): void
    {
        News::factory()->published()->create(['slug' => 'live-story']);
        News::factory()->status('draft')->create(['slug' => 'draft-story']);
        News::factory()->status('pending_review')->create(['slug' => 'pending-story']);
        News::factory()->published(now()->addDay())->create(['slug' => 'future-story']);

        $res = $this->getJson('/api/v1/news?perPage=10')->assertOk();

        $this->assertSame(['live-story'], array_column($res->json('data'), 'slug'));
        $res->assertJsonPath('meta.total', 1)->assertJsonStructure(['meta' => ['currentPage', 'lastPage', 'perPage', 'total']]);
        $this->getJson('/api/v1/news/draft-story')->assertNotFound();
        $this->getJson('/api/v1/news/live-story')->assertOk()->assertJsonStructure(['data' => ['content' => ['ar', 'en'], 'author', 'seo']]);
    }

    public function test_sitemap_lists_locale_less_paths(): void
    {
        $this->seed(DemoContentSeeder::class);

        $res = $this->getJson('/api/v1/sitemap')->assertOk()->assertJsonStructure(['data' => [['path', 'updatedAt']]]);
        $paths = array_column($res->json('data'), 'path');

        $this->assertContains('/', $paths);
        $this->assertContains('/about', $paths);
        $this->assertContains('/news/solar-irrigation-financing-2026', $paths);
        foreach ($paths as $p) {
            $this->assertStringStartsWith('/', $p);
            $this->assertDoesNotMatchRegularExpression('#^/(ar|en)(/|$)#', $p);
        }
    }

    public function test_cities_endpoint_matches_admin_select_ids(): void
    {
        $this->seed(DemoContentSeeder::class);

        $res = $this->getJson('/api/v1/cities')->assertOk();

        $res->assertJsonPath('data.0', ['id' => 1, 'slug' => 'sanaa', 'name' => ['ar' => 'صنعاء', 'en' => "Sana'a"]]);
        $res->assertJsonPath('data.9.id', 10);
        $res->assertJsonPath('data.9.name.en', 'Hajjah');
    }

    public function test_public_responses_carry_security_headers(): void
    {
        $this->getJson('/api/v1/settings')->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY');
    }
}

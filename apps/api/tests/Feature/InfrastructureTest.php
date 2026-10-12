<?php

namespace Tests\Feature;

use App\Modules\Catalog\Infrastructure\Models\Service;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Support\Content\ContentCache;
use Database\Seeders\AdminUserSeeder;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class InfrastructureTest extends TestCase
{
    public function test_content_change_bumps_cache_version_and_revalidates_the_site(): void
    {
        config(['services.frontend_revalidate.url' => 'https://www.example.test/api/revalidate', 'services.frontend_revalidate.secret' => 'shh']);
        Http::fake(['*' => Http::response(['revalidated' => true])]);
        $before = ContentCache::version();

        Service::query()->create(['slug' => 'x', 'icon' => 'account', 'title_ar' => 'س', 'title_en' => 'S', 'summary_ar' => 'م', 'summary_en' => 'M', 'href' => '/x', 'status' => 'active']);

        $this->assertGreaterThan($before, ContentCache::version());
        Http::assertSent(fn ($req) => $req->url() === 'https://www.example.test/api/revalidate'
            && $req->hasHeader('X-Revalidate-Secret', 'shh')
            && in_array('services', $req['tags'], true));
    }

    /** Set/unset an env var for env() (Dotenv reads $_ENV/$_SERVER first, then getenv). */
    private function env(string $key, ?string $value): void
    {
        foreach ([&$_ENV, &$_SERVER] as &$bag) {
            if ($value === null) {
                unset($bag[$key]);
            } else {
                $bag[$key] = $value;
            }
        }
        putenv($value === null ? $key : "{$key}={$value}");
    }

    public function test_admin_seeder_refuses_weak_or_missing_password(): void
    {
        $this->seedRbac();
        $this->env('ADMIN_EMAIL', 'root@withaq.example');
        $this->env('ADMIN_PASSWORD', 'password');
        try {
            $this->expectException(\RuntimeException::class);
            $this->seed(AdminUserSeeder::class);
        } finally {
            $this->env('ADMIN_EMAIL', null);
            $this->env('ADMIN_PASSWORD', null);
            $this->assertSame(0, User::query()->count());
        }
    }

    public function test_admin_seeder_creates_super_admin_from_env(): void
    {
        $this->seedRbac();
        $this->env('ADMIN_EMAIL', 'root@withaq.example');
        $this->env('ADMIN_PASSWORD', 'Sup3r!Secret#Pass');
        try {
            $this->seed(AdminUserSeeder::class);
        } finally {
            $this->env('ADMIN_EMAIL', null);
            $this->env('ADMIN_PASSWORD', null);
        }
        $user = User::query()->where('email', 'root@withaq.example')->firstOrFail();
        $this->assertTrue($user->isSuperAdmin());
        $this->assertStringStartsWith('$argon2id$', $user->getAuthPassword());
    }

    public function test_cors_allows_only_first_party_origins(): void
    {
        $this->withHeaders(['Origin' => 'https://evil.example', 'Access-Control-Request-Method' => 'GET'])
            ->options('/api/v1/settings')->assertHeaderMissing('Access-Control-Allow-Origin');
        $this->withHeaders(['Origin' => 'http://localhost:3001', 'Access-Control-Request-Method' => 'GET'])
            ->options('/api/v1/settings')->assertHeader('Access-Control-Allow-Origin', 'http://localhost:3001');
    }

    public function test_full_seed_runs(): void
    {
        $this->seed();   // DatabaseSeeder (testing env: no ADMIN_EMAIL → admin skipped)
        $this->assertGreaterThan(0, \DB::table('pages')->count());
        $this->getJson('/api/v1/pages/home/content')->assertOk();
    }
}

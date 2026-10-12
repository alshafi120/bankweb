<?php

namespace Tests\Feature\Admin;

use App\Modules\Audit\Infrastructure\Models\AuditLog;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\News\Infrastructure\Models\News;
use App\Modules\News\Infrastructure\Models\NewsCategory;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    private function newsPayload(): array
    {
        $cat = NewsCategory::query()->create(['slug' => 'bank', 'name_ar' => 'أخبار', 'name_en' => 'Bank news']);

        return [
            'title' => ['ar' => 'خبر', 'en' => 'Story'], 'excerpt' => ['ar' => 'مقتطف', 'en' => 'Excerpt'],
            'content' => ['ar' => '<p>نص</p>', 'en' => '<p>Body</p>'], 'slug' => '', 'categoryId' => $cat->id, 'featuredMedia' => null,
        ];
    }

    public function test_viewer_cannot_create_news(): void
    {
        $this->actingAsRole('viewer');

        $this->admin('GET', '/news')->assertOk();
        $this->admin('POST', '/news', $this->newsPayload())->assertForbidden();
    }

    public function test_reviewer_cannot_create_but_can_view(): void
    {
        $this->actingAsRole('reviewer');

        $this->admin('GET', '/news')->assertOk();
        $this->admin('POST', '/news', $this->newsPayload())->assertForbidden();
        $this->admin('POST', '/pages', ['title' => ['ar' => 'ص', 'en' => 'P'], 'slug' => 'p', 'template' => 'default'])->assertForbidden();
        $this->admin('GET', '/users')->assertForbidden();
    }

    public function test_news_manager_can_create_news(): void
    {
        $user = $this->actingAsRole('news_manager');

        $res = $this->admin('POST', '/news', $this->newsPayload())->assertCreated();
        $res->assertJsonPath('data.status', 'draft')->assertJsonPath('data.author.id', $user->id)->assertJsonPath('data.slug', 'story');
    }

    public function test_super_admin_passes_every_gate(): void
    {
        $this->actingAsRole('super_admin');

        foreach (['/users', '/roles', '/audit-logs', '/settings', '/dashboard', '/permissions'] as $uri) {
            $this->admin('GET', $uri)->assertOk();
        }
    }

    public function test_author_cannot_approve_own_news_even_as_super_admin(): void
    {
        $author = $this->actingAsRole('super_admin');
        $news = News::factory()->status('pending_review')->by($author->id)->create();

        $this->admin('POST', "/news/{$news->id}/approve")->assertForbidden();
        $this->assertSame('pending_review', $news->fresh()->status);

        // A different reviewer can approve, then a publisher publishes.
        $reviewer = User::factory()->withRole('reviewer')->create();
        $this->signIn($reviewer);
        $this->admin("POST", "/news/{$news->id}/approve")->assertOk()->assertJsonPath('data.status', 'approved')->assertJsonPath('data.reviewedBy.id', $reviewer->id);
        $this->admin('POST', "/news/{$news->id}/publish")->assertForbidden();   // reviewer lacks news.publish

        $publisher = User::factory()->withRole('news_manager')->create();
        $this->signIn($publisher);
        $this->admin('POST', "/news/{$news->id}/publish")->assertOk()->assertJsonPath('data.status', 'published');
        $this->assertTrue(AuditLog::query()->where('action', 'approve')->exists());
        $this->assertTrue(AuditLog::query()->where('action', 'publish')->exists());
    }

    public function test_reject_requires_reason(): void
    {
        $this->seedRbac();
        $author = User::factory()->withRole('news_manager')->create();
        $news = News::factory()->status('pending_review')->by($author->id)->create();
        $this->signIn(User::factory()->withRole('reviewer')->create());

        $this->admin('POST', "/news/{$news->id}/reject", ['reason' => ''])->assertUnprocessable();
        $this->admin('POST', "/news/{$news->id}/reject", ['reason' => 'Add a source.'])->assertOk()
            ->assertJsonPath('data.status', 'draft')->assertJsonPath('data.reviewNote', 'Add a source.');
    }

    public function test_role_matrix_is_applied_per_resource(): void
    {
        $this->actingAsRole('branch_manager');

        $this->admin('GET', '/branches')->assertOk();
        $this->admin('GET', '/cities')->assertOk();            // cities use branches.* permissions
        $this->admin('GET', '/applications')->assertForbidden();
        $this->admin('GET', '/news')->assertForbidden();
    }
}

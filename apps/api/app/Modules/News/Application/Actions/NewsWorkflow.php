<?php

namespace App\Modules\News\Application\Actions;

use App\Modules\Audit\Application\Services\AuditLogger;
use App\Modules\Audit\Domain\Enums\AuditAction;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\News\Domain\Enums\ContentStatus;
use App\Modules\News\Infrastructure\Models\News;
use Carbon\CarbonInterface;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;

/**
 * Editorial workflow with Maker/Checker (four-eyes):
 *   draft ─submit→ pending_review ─approve→ approved ─publish→ published
 *                               └─reject→ draft (with reason)      └─schedule→ scheduled ─(cron)→ published
 * Rules: the author can never approve, publish or schedule their own article — not even a super admin.
 * Approve needs `news.approve`; publish/schedule need `news.publish`; submit needs `news.update`.
 */
class NewsWorkflow
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function submit(News $news, User $actor): News
    {
        $this->authorize($actor, 'news.update');
        $this->requireStatus($news, [ContentStatus::Draft, ContentStatus::Archived]);
        $this->requireComplete($news);

        return $this->transition($news, ContentStatus::PendingReview, ['review_note' => null]);
    }

    public function approve(News $news, User $actor): News
    {
        $this->authorize($actor, 'news.approve');
        $this->forbidOwn($news, $actor, 'approve');
        $this->requireStatus($news, [ContentStatus::PendingReview]);

        $this->transition($news, ContentStatus::Approved, ['reviewed_by' => $actor->id, 'reviewed_at' => now(), 'review_note' => null]);
        $this->audit->log(AuditAction::Approve, $news);

        return $news;
    }

    public function reject(News $news, User $actor, string $reason): News
    {
        $this->authorize($actor, 'news.approve');
        $this->forbidOwn($news, $actor, 'reject');
        $this->requireStatus($news, [ContentStatus::PendingReview, ContentStatus::Approved, ContentStatus::Scheduled]);

        $this->transition($news, ContentStatus::Draft, ['reviewed_by' => $actor->id, 'reviewed_at' => now(), 'review_note' => $reason, 'publish_at' => null]);
        $this->audit->log(AuditAction::Reject, $news, ['after' => ['reason' => $reason]]);

        return $news;
    }

    public function publish(News $news, User $actor): News
    {
        $this->authorize($actor, 'news.publish');
        $this->forbidOwn($news, $actor, 'publish');
        $this->requireStatus($news, [ContentStatus::Approved, ContentStatus::Scheduled]);

        $this->transition($news, ContentStatus::Published, ['published_at' => now(), 'publish_at' => null]);
        $this->audit->log(AuditAction::Publish, $news);

        return $news;
    }

    public function schedule(News $news, User $actor, CarbonInterface $at): News
    {
        $this->authorize($actor, 'news.publish');
        $this->forbidOwn($news, $actor, 'schedule');
        $this->requireStatus($news, [ContentStatus::Approved, ContentStatus::Scheduled]);

        $this->transition($news, ContentStatus::Scheduled, ['publish_at' => $at]);
        $this->audit->log(AuditAction::Publish, $news, ['after' => ['scheduledFor' => $at->toIso8601String()]]);

        return $news;
    }

    private function transition(News $news, ContentStatus $to, array $attributes = []): News
    {
        $news->forceFill(['status' => $to->value] + $attributes)->save();

        return $news;
    }

    private function authorize(User $actor, string $permission): void
    {
        if (! $actor->hasPermission($permission)) {
            throw new AuthorizationException('Forbidden.');
        }
    }

    private function forbidOwn(News $news, User $actor, string $verb): void
    {
        if ($news->author_id !== null && (int) $news->author_id === (int) $actor->id) {
            throw new AuthorizationException("Maker/Checker: you cannot {$verb} your own article.");
        }
    }

    /** @param  list<ContentStatus>  $allowed */
    private function requireStatus(News $news, array $allowed): void
    {
        if (! in_array(ContentStatus::from($news->status), $allowed, true)) {
            throw ValidationException::withMessages(['status' => ["This action is not allowed while the article is '{$news->status}'."]]);
        }
    }

    /** Never publish in an incomplete language (docs/ARCHITECTURE.md §3). */
    private function requireComplete(News $news): void
    {
        $errors = [];
        foreach (['title', 'excerpt', 'content'] as $base) {
            foreach (['ar', 'en'] as $l) {
                if (blank(strip_tags((string) $news->getAttribute("{$base}_{$l}")))) {
                    $errors["{$base}.{$l}"] = ['Required before submitting for review.'];
                }
            }
        }
        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }
}

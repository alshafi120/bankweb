<?php

namespace App\Console\Commands;

use App\Modules\Content\Infrastructure\Models\Page;
use App\Modules\News\Infrastructure\Models\News;
use Illuminate\Console\Command;

/** Every minute: scheduled pages/news whose publish_at has passed become published. */
class PublishScheduledContent extends Command
{
    protected $signature = 'content:publish-scheduled';

    protected $description = 'Publish pages and news whose scheduled publish time has passed';

    public function handle(): int
    {
        $count = 0;
        foreach ([Page::class, News::class] as $model) {
            $model::query()->where('status', 'scheduled')->whereNotNull('publish_at')->where('publish_at', '<=', now())
                ->orderBy('id')->each(function ($item) use (&$count) {
                    // Saved through Eloquent so observers bump the cache and trigger ISR revalidation.
                    $item->forceFill(['status' => 'published', 'published_at' => $item->publish_at, 'publish_at' => null])->save();
                    $count++;
                });
        }

        $this->info("Published {$count} item(s).");

        return self::SUCCESS;
    }
}

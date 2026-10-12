<?php

namespace App\Console\Commands;

use App\Modules\Analytics\Infrastructure\Models\PageView;
use App\Modules\Analytics\Infrastructure\Models\ServiceView;
use Illuminate\Console\Command;

class PruneAnalytics extends Command
{
    protected $signature = 'analytics:prune {--days=400 : Keep this many days}';

    protected $description = 'Delete page/service view rows older than the retention window';

    public function handle(): int
    {
        $cutoff = now()->subDays(max(30, (int) $this->option('days')))->toDateString();
        $deleted = PageView::query()->where('date', '<', $cutoff)->delete() + ServiceView::query()->where('date', '<', $cutoff)->delete();
        $this->info("Deleted {$deleted} row(s).");

        return self::SUCCESS;
    }
}

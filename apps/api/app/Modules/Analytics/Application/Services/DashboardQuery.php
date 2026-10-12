<?php

namespace App\Modules\Analytics\Application\Services;

use App\Modules\Analytics\Infrastructure\Models\PageView;
use App\Modules\Analytics\Infrastructure\Models\ServiceView;
use App\Modules\Applications\Infrastructure\Models\Application;
use App\Modules\Applications\Infrastructure\Models\Complaint;
use App\Modules\Careers\Infrastructure\Models\Job;
use App\Modules\Network\Infrastructure\Models\Branch;
use App\Modules\News\Infrastructure\Models\News;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

/** Contract `DashboardData` (cached 2 minutes; aggregates only, no personal data). */
class DashboardQuery
{
    public function get(): array
    {
        return Cache::remember('dashboard:v1:'.now()->format('YmdHi'), 120, fn () => $this->build());
    }

    private function build(): array
    {
        $today = Carbon::today();
        $from30 = $today->copy()->subDays(29);
        $from14 = $today->copy()->subDays(13);

        $visitsByDay = PageView::query()->where('date', '>=', $from30->toDateString())
            ->selectRaw('date, count(*) as c')->groupBy('date')->pluck('c', 'date')
            ->mapWithKeys(fn ($c, $d) => [Carbon::parse($d)->toDateString() => (int) $c]);

        $apps = Application::query()->where('created_at', '>=', $from14)
            ->selectRaw('type, created_at')->get()
            ->groupBy(fn ($a) => $a->created_at->toDateString());

        return [
            'kpis' => [
                'visitors' => (int) PageView::query()->where('date', '>=', $from30->toDateString())->distinct()->count('visitor_hash'),
                'applications' => Application::query()->where('created_at', '>=', $from30)->count(),
                'accountRequests' => Application::query()->where('type', 'account')->where('created_at', '>=', $from30)->count(),
                'financingRequests' => Application::query()->where('type', 'financing')->where('created_at', '>=', $from30)->count(),
                'cardRequests' => Application::query()->where('type', 'card')->where('created_at', '>=', $from30)->count(),
                'complaints' => Complaint::query()->where('created_at', '>=', $from30)->count(),
                'news' => News::query()->published()->count(),
                'jobs' => Job::query()->open()->count(),
                'branches' => Branch::query()->active()->count(),
            ],
            'charts' => [
                'visits' => collect(range(0, 29))->map(function ($i) use ($from30, $visitsByDay) {
                    $d = $from30->copy()->addDays($i)->toDateString();

                    return ['date' => $d, 'count' => $visitsByDay[$d] ?? 0];
                })->all(),
                'dailyApplications' => collect(range(0, 13))->map(function ($i) use ($from14, $apps) {
                    $d = $from14->copy()->addDays($i)->toDateString();
                    $day = $apps[$d] ?? collect();

                    return [
                        'date' => $d,
                        'account' => $day->where('type', 'account')->count(),
                        'financing' => $day->where('type', 'financing')->count(),
                        'card' => $day->where('type', 'card')->count(),
                    ];
                })->all(),
                'topServices' => ServiceView::query()->where('date', '>=', $from30->toDateString())
                    ->selectRaw('service_key, sum(count) as total')->groupBy('service_key')->orderByDesc('total')->limit(8)->get()
                    ->map(fn ($r) => ['label' => $r->service_key, 'count' => (int) $r->total])->all(),
                'topPages' => PageView::query()->where('date', '>=', $from30->toDateString())
                    ->selectRaw('path, count(*) as total')->groupBy('path')->orderByDesc('total')->limit(10)->get()
                    ->map(fn ($r) => ['path' => $r->path, 'count' => (int) $r->total])->all(),
                'applicationsByCity' => Application::query()->where('created_at', '>=', $from30)
                    ->selectRaw('city, count(*) as total')->groupBy('city')->orderByDesc('total')->limit(10)->get()
                    ->map(fn ($r) => ['city' => (string) $r->city, 'count' => (int) $r->total])->all(),
                'trafficSources' => PageView::query()->where('date', '>=', $from30->toDateString())
                    ->selectRaw('source, count(*) as total')->groupBy('source')->orderByDesc('total')->get()
                    ->map(fn ($r) => ['source' => $r->source, 'count' => (int) $r->total])->all(),
            ],
        ];
    }
}

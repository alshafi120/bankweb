<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * On-demand ISR: POST FRONTEND_REVALIDATE_URL with header X-Revalidate-Secret (apps/web/src/app/api/revalidate).
 * Body: { tags: string[], paths: string[] }.
 */
class RevalidateFrontend implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;

    public int $timeout = 15;

    /**
     * @param  list<string>  $tags
     * @param  list<string>  $paths
     */
    public function __construct(public array $tags = [], public array $paths = []) {}

    /** @return list<int> */
    public function backoff(): array
    {
        return [10, 30, 60, 300];
    }

    public function handle(): void
    {
        $url = config('services.frontend_revalidate.url');
        $secret = config('services.frontend_revalidate.secret');
        if (blank($url) || blank($secret)) {
            return;
        }

        $response = Http::timeout(10)
            ->acceptJson()
            ->withHeaders(['X-Revalidate-Secret' => $secret])
            ->post($url, ['tags' => array_slice($this->tags, 0, 50), 'paths' => array_slice($this->paths, 0, 50)]);

        if ($response->serverError() || $response->status() === 429) {
            throw new RuntimeException('Frontend revalidation failed with HTTP '.$response->status());
        }
    }
}

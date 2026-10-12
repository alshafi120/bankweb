<?php

namespace App\Modules\Analytics\Application\Actions;

use App\Modules\Analytics\Infrastructure\Models\PageView;
use App\Modules\Analytics\Infrastructure\Models\ServiceView;
use App\Support\Security\PiiHasher;
use Illuminate\Support\Str;

/**
 * Privacy-friendly analytics: path without query string, referrer host only, source classification,
 * visitor hash = HMAC(IP + UA + daily salt). Known bots are ignored.
 */
class RecordPageView
{
    private const SEARCH = ['google.', 'bing.', 'duckduckgo.', 'yahoo.', 'yandex.', 'baidu.', 'ecosia.'];

    private const SOCIAL = ['facebook.', 'fb.', 'instagram.', 't.co', 'x.com', 'twitter.', 'linkedin.', 'youtube.', 'whatsapp.', 'telegram.', 'tiktok.', 'snapchat.'];

    private const SERVICE_PREFIXES = ['accounts', 'financing', 'cards', 'transfers', 'digital', 'services', 'offers', 'branches', 'atms', 'agents', 'apply'];

    public function __invoke(string $path, ?string $referrer, ?string $ip, ?string $userAgent): void
    {
        if ($userAgent && preg_match('/bot|crawl|spider|slurp|preview|headless|lighthouse/i', $userAgent)) {
            return;
        }

        $path = Str::limit(strtok($path, '?#') ?: '/', 300, '');
        $host = $this->referrerHost($referrer);
        $today = now()->toDateString();

        PageView::query()->create([
            'date' => $today,
            'path' => $path,
            'referrer_host' => $host,
            'source' => $this->source($host),
            'visitor_hash' => PiiHasher::visitor($ip, $userAgent, $today),
        ]);

        if ($key = $this->serviceKey($path)) {
            $updated = ServiceView::query()->where('date', $today)->where('service_key', $key)->increment('count');
            if ($updated === 0) {
                ServiceView::query()->insertOrIgnore(['date' => $today, 'service_key' => $key, 'count' => 1]);
            }
        }
    }

    private function referrerHost(?string $referrer): ?string
    {
        if (! $referrer) {
            return null;
        }
        $host = parse_url(str_contains($referrer, '://') ? $referrer : 'https://'.$referrer, PHP_URL_HOST);

        return is_string($host) && $host !== '' ? Str::limit(Str::lower($host), 190, '') : null;
    }

    private function source(?string $host): string
    {
        if ($host === null) {
            return 'direct';
        }
        foreach (self::SEARCH as $s) {
            if (str_contains($host, $s)) {
                return 'search';
            }
        }
        foreach (self::SOCIAL as $s) {
            if (str_contains($host, $s)) {
                return 'social';
            }
        }

        return 'referral';
    }

    /** /ar/financing/personal → "financing" */
    private function serviceKey(string $path): ?string
    {
        $segments = array_values(array_filter(explode('/', $path)));
        if (isset($segments[0]) && in_array($segments[0], ['ar', 'en'], true)) {
            array_shift($segments);
        }
        $first = $segments[0] ?? null;

        return $first !== null && in_array($first, self::SERVICE_PREFIXES, true) ? $first : null;
    }
}

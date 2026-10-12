<?php

namespace App\Modules\Content\Application\Services;

use App\Modules\Content\Infrastructure\Models\Setting;
use Illuminate\Support\Arr;

/**
 * Typed access to the `settings` key/value table.
 *  - group "site": SiteSettings fields (bankName, phone, …) — contract `SiteSettings`
 *  - group "seo":  defaultSeo — admin `AdminSettings.defaultSeo`
 *  - group "home": editable home lists that have no catalogue table (needs, digital channels, stats,
 *                  reasons, reasonStats) — contract `HomeContent`
 */
final class SiteSettingsService
{
    /** Keys of `SiteSettings` stored one row per key. */
    public const SITE_KEYS = ['bankName', 'phone', 'tollFree', 'email', 'address', 'internetBankingUrl', 'social', 'appStores'];

    public const HOME_KEYS = ['needs', 'digital', 'stats', 'reasons', 'reasonStats'];

    /** @var array<string, mixed>|null */
    private ?array $cache = null;

    /** @return array<string, mixed> */
    public function all(): array
    {
        return $this->cache ??= Setting::query()->pluck('value', 'key')->all();
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return Arr::get($this->all(), $key, $default);
    }

    /** Contract `SiteSettings`. */
    public function site(): array
    {
        $l = fn ($v) => ['ar' => (string) ($v['ar'] ?? ''), 'en' => (string) ($v['en'] ?? '')];
        $social = (array) $this->get('social', []);
        $stores = (array) $this->get('appStores', []);

        $out = [
            'bankName' => $l($this->get('bankName', [])),
            'phone' => (string) $this->get('phone', ''),
            'tollFree' => (string) $this->get('tollFree', ''),
            'email' => (string) $this->get('email', ''),
            'address' => $l($this->get('address', [])),
            'internetBankingUrl' => (string) $this->get('internetBankingUrl', ''),
            'social' => [
                'facebook' => (string) ($social['facebook'] ?? ''),
                'instagram' => (string) ($social['instagram'] ?? ''),
                'x' => (string) ($social['x'] ?? ''),
                'linkedin' => (string) ($social['linkedin'] ?? ''),
                'youtube' => (string) ($social['youtube'] ?? ''),
            ],
            'appStores' => [
                'googlePlay' => (string) ($stores['googlePlay'] ?? ''),
                'appStore' => (string) ($stores['appStore'] ?? ''),
            ],
        ];

        // Public key only; the secret never leaves the server.
        $siteKey = config('services.turnstile.site_key') ?: $this->get('turnstileSiteKey');
        if (filled($siteKey)) {
            $out['turnstileSiteKey'] = (string) $siteKey;
        }

        return $out;
    }

    public function defaultSeo(): array
    {
        $seo = (array) $this->get('defaultSeo', []);
        $l = fn ($v) => ['ar' => (string) ($v['ar'] ?? ''), 'en' => (string) ($v['en'] ?? '')];

        return [
            'title' => $l($seo['title'] ?? []),
            'description' => $l($seo['description'] ?? []),
            'keywords' => $l($seo['keywords'] ?? []),
            'canonical' => $seo['canonical'] ?? null,
            'ogImage' => $seo['ogImage'] ?? null,
            'noindex' => (bool) ($seo['noindex'] ?? false),
        ];
    }

    /** @return list<array<string, mixed>> */
    public function homeList(string $key): array
    {
        return array_values((array) $this->get('home.'.$key, []));
    }

    /** Partial update (PUT /admin/settings). Unknown keys are ignored by the caller's validation. */
    public function put(string $key, mixed $value, string $group): void
    {
        $setting = Setting::query()->firstOrNew(['key' => $key]);
        $setting->fill(['value' => $value, 'group' => $group])->save();
        $this->cache = null;
    }
}

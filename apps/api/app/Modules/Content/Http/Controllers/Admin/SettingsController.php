<?php

namespace App\Modules\Content\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Modules\Content\Application\Services\SiteSettingsService;
use App\Support\Admin\AdminResource;
use App\Support\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** GET /settings → `AdminSettings` (SiteSettings + defaultSeo) · PUT /settings (partial). */
class SettingsController extends Controller
{
    public function __construct(private readonly SiteSettingsService $settings) {}

    public function show(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('settings.view'), 403, 'Forbidden.');

        return ApiResponse::data($this->payload());
    }

    public function update(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('settings.update'), 403, 'Forbidden.');
        $url = ['nullable', 'string', 'max:500', 'regex:#^https://#i'];
        $loc = fn (string $k) => [$k => ['sometimes', 'array:ar,en'], "{$k}.ar" => ['required_with:'.$k, 'string', 'max:255'], "{$k}.en" => ['required_with:'.$k, 'string', 'max:255']];

        $data = $request->validate([
            ...$loc('bankName'),
            ...$loc('address'),
            'phone' => ['sometimes', 'string', 'max:40', 'regex:/^[+\d\s()-]+$/'],
            'tollFree' => ['sometimes', 'string', 'max:40', 'regex:/^[+\d\s()-]+$/'],
            'email' => ['sometimes', 'string', 'email:rfc', 'max:190'],
            'internetBankingUrl' => ['sometimes', ...$url],
            'social' => ['sometimes', 'array:facebook,instagram,x,linkedin,youtube'],
            'social.*' => $url,
            'appStores' => ['sometimes', 'array:googlePlay,appStore'],
            'appStores.*' => $url,
            'turnstileSiteKey' => ['sometimes', 'nullable', 'string', 'max:120'],
            ...AdminResource::seoRules('defaultSeo'),
            'home' => ['sometimes', 'array:needs,digital,stats,reasons,reasonStats'],
            'home.*' => ['array', 'max:20'],
            'home.*.*' => ['array'],
        ]);

        DB::transaction(function () use ($data) {
            foreach ($data as $key => $value) {
                match (true) {
                    in_array($key, SiteSettingsService::SITE_KEYS, true), $key === 'turnstileSiteKey' => $this->settings->put($key, $value, 'site'),
                    $key === 'defaultSeo' => $this->settings->put('defaultSeo', $value, 'seo'),
                    $key === 'home' => array_map(fn ($k) => $this->settings->put('home.'.$k, array_values($value[$k]), 'home'), array_keys($value)),
                    default => null,
                };
            }
        });

        return ApiResponse::data($this->payload());
    }

    private function payload(): array
    {
        $site = $this->settings->site();
        $site['turnstileSiteKey'] = $site['turnstileSiteKey'] ?? null;

        return $site + [
            'defaultSeo' => $this->settings->defaultSeo(),
            'home' => array_combine(SiteSettingsService::HOME_KEYS, array_map(fn ($k) => $this->settings->homeList($k), SiteSettingsService::HOME_KEYS)),
        ];
    }
}

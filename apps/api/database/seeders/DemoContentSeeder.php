<?php

namespace Database\Seeders;

use App\Modules\Careers\Infrastructure\Models\Job;
use App\Modules\Catalog\Infrastructure\Models\Card;
use App\Modules\Catalog\Infrastructure\Models\FinancingProduct;
use App\Modules\Catalog\Infrastructure\Models\Offer;
use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Catalog\Infrastructure\Models\Service;
use App\Modules\Content\Application\Services\PublicContentQuery;
use App\Modules\Content\Infrastructure\Models\Banner;
use App\Modules\Content\Infrastructure\Models\Document;
use App\Modules\Content\Infrastructure\Models\Faq;
use App\Modules\Content\Infrastructure\Models\FaqCategory;
use App\Modules\Content\Infrastructure\Models\Menu;
use App\Modules\Content\Infrastructure\Models\Page;
use App\Modules\Content\Infrastructure\Models\SeoMetadata;
use App\Modules\Content\Infrastructure\Models\Setting;
use App\Modules\Media\Infrastructure\Models\Media;
use App\Modules\Network\Infrastructure\Models\Agent;
use App\Modules\Network\Infrastructure\Models\Atm;
use App\Modules\Network\Infrastructure\Models\Branch;
use App\Modules\Network\Infrastructure\Models\City;
use App\Modules\News\Infrastructure\Models\News;
use App\Modules\News\Infrastructure\Models\NewsCategory;
use App\Support\Content\ContentCache;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Demo CMS content for the fictional "Withaq Bank" — reproduces apps/web/src/content/demo/* exactly, so the
 * live site looks identical when wired to the API. Source: database/seeders/data/demo-content.json
 * (generated from the web demo TypeScript; see README). Fictional names, numbers and addresses only.
 * Idempotent: skips when content already exists (use migrate:fresh --seed to rebuild).
 */
class DemoContentSeeder extends Seeder
{
    private array $d;

    /** @var array<string, int> city English name → id */
    private array $cities = [];

    /** @var array<int, int> fixture media id → library id */
    private array $mediaMap = [];

    public function run(): void
    {
        if (Service::query()->exists()) {
            $this->command?->warn('Demo content already present — skipped.');

            return;
        }

        $path = database_path('seeders/data/demo-content.json');
        $this->d = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

        ContentCache::muted(fn () => DB::transaction(function () {
            $this->settings();
            $this->cities();
            $this->catalog();
            $this->network();
            $this->news();
            $this->offers();
            $this->faqs();
            $this->jobs();
            $this->pages();
            $this->menus();
            $this->staticSeo();
            $this->banners();
        }));
    }

    private function settings(): void
    {
        $s = $this->d['home']['settings'];
        $site = Arr::only($s, ['bankName', 'phone', 'tollFree', 'email', 'address', 'internetBankingUrl', 'social', 'appStores']);
        foreach ($site as $key => $value) {
            Setting::query()->create(['key' => $key, 'value' => $value, 'group' => 'site']);
        }
        foreach (['needs', 'digital', 'stats', 'reasons', 'reasonStats'] as $key) {
            Setting::query()->create(['key' => 'home.'.$key, 'value' => $this->d['home'][$key], 'group' => 'home']);
        }
        Setting::query()->create(['key' => 'defaultSeo', 'group' => 'seo', 'value' => [
            'title' => ['ar' => 'بنك وِثاق — خدمات مصرفية آمنة وقريبة منك', 'en' => 'Withaq Bank — secure banking close to you'],
            'description' => [
                'ar' => 'افتح حسابك، اطلب تمويلاً أو بطاقة، وابحث عن أقرب فرع. خدمات مصرفية متوافقة مع الشريعة في كل اليمن.',
                'en' => 'Open an account, apply for financing or a card and find your nearest branch. Sharia-compliant banking across Yemen.',
            ],
            'keywords' => ['ar' => 'بنك، اليمن، تمويل، حساب، بطاقات', 'en' => 'bank, Yemen, financing, account, cards'],
            'canonical' => null, 'ogImage' => null, 'noindex' => false,
        ]]);
    }

    private function cities(): void
    {
        $list = [
            ['sanaa', 'صنعاء', "Sana'a", 'أمانة العاصمة', 'Amanat Al-Asimah', 15.3694, 44.1910],
            ['aden', 'عدن', 'Aden', 'عدن', 'Aden', 12.7855, 45.0187],
            ['taiz', 'تعز', 'Taiz', 'تعز', 'Taiz', 13.5795, 44.0209],
            ['mukalla', 'المكلا', 'Mukalla', 'حضرموت', 'Hadramawt', 14.5426, 49.1242],
            ['marib', 'مأرب', 'Marib', 'مأرب', 'Marib', 15.4627, 45.3220],
            ['hodeidah', 'الحديدة', 'Hodeidah', 'الحديدة', 'Al Hudaydah', 14.7978, 42.9545],
            ['ibb', 'إب', 'Ibb', 'إب', 'Ibb', 13.9667, 44.1833],
            ['seiyun', 'سيئون', 'Seiyun', 'حضرموت', 'Hadramawt', 15.9430, 48.7890],
            ['dhamar', 'ذمار', 'Dhamar', 'ذمار', 'Dhamar', 14.5420, 44.4050],
            ['hajjah', 'حجة', 'Hajjah', 'حجة', 'Hajjah', 15.6940, 43.6050],
        ];
        foreach ($list as [$slug, $ar, $en, $gar, $gen, $lat, $lng]) {
            $this->cities[$en] = City::query()->create([
                'slug' => $slug, 'name_ar' => $ar, 'name_en' => $en, 'governorate_ar' => $gar, 'governorate_en' => $gen, 'lat' => $lat, 'lng' => $lng,
            ])->id;
        }
    }

    private function catalog(): void
    {
        foreach ($this->d['services'] as $i => $s) {
            Service::query()->create([
                'slug' => $s['id'], 'icon' => $s['icon'], 'href' => $s['href'], 'position' => $i + 1, 'status' => 'active',
                ...$this->loc('title', $s['title']), ...$this->loc('summary', $s['summary']), ...$this->loc('body', $s['body'] ?? null),
            ]);
        }
        foreach ($this->d['accounts'] as $i => $a) {
            Product::query()->create([
                'slug' => $a['id'], 'account_type' => $a['accountType'], 'minimum_balance' => $a['minimumBalance'], 'currency' => 'YER',
                'position' => $i + 1, 'status' => 'active',
                ...$this->loc('name', $a['name']), ...$this->loc('tagline', $a['tagline']),
                ...$this->loc('features', $a['features']), ...$this->loc('requirements', $a['requirements']),
            ]);
        }
        foreach ($this->d['financing'] as $i => $f) {
            FinancingProduct::query()->create([
                'slug' => $f['id'], 'max_amount' => $f['maxAmount'], 'max_months' => $f['maxMonths'], 'annual_profit_rate' => $f['annualProfitRate'],
                'position' => $i + 1, 'status' => 'active',
                ...$this->loc('name', $f['name']), ...$this->loc('summary', $f['summary']), ...$this->loc('body', $f['body'] ?? null),
                ...$this->loc('requirements', $f['requirements'] ?? ['ar' => [], 'en' => []]),
            ]);
        }
        foreach ($this->d['cards'] as $i => $c) {
            Card::query()->create([
                'slug' => $c['id'], 'network' => $c['network'], 'tone' => $c['tone'], 'position' => $i + 1, 'status' => 'active',
                ...$this->loc('name', $c['name']), ...$this->loc('summary', $c['summary']),
                ...$this->loc('features', $c['features'] ?? ['ar' => [], 'en' => []]), ...$this->loc('fees', $c['fees'] ?? null),
            ]);
        }
    }

    private function network(): void
    {
        $positions = ['branch' => 0, 'atm' => 0, 'agent' => 0];
        $managers = ['أ. فيصل الشامي', 'أ. سلوى العريقي', 'أ. ماجد باعباد', 'أ. نوال الأهدل'];

        foreach ($this->d['locations'] as $l) {
            $type = $l['type'];
            $pos = ++$positions[$type];
            $attrs = [
                'slug' => $l['id'], 'city_id' => $this->city($l['city']['en']), 'phone' => $l['phone'],
                'lat' => $l['lat'], 'lng' => $l['lng'], 'position' => $pos, 'status' => 'active',
                ...$this->loc('name', $l['name']), ...$this->loc('district', $l['district']), ...$this->loc('address', $l['address']),
                ...$this->loc('hours', $l['hours']), ...$this->loc('services', $l['services']),
            ];

            match ($type) {
                'branch' => Branch::query()->create($attrs + ['manager_name' => $managers[$pos % count($managers)]]),
                'atm' => Atm::query()->create($attrs + [
                    'is_24h' => str_contains($l['hours']['en'], '24'),
                    'supports_deposit' => in_array('Deposit', $l['services']['en'], true),
                ]),
                'agent' => Agent::query()->create($attrs + ['agent_code' => sprintf('AG-%04d', 1000 + $pos * 7)]),
            };
        }
    }

    private function news(): void
    {
        $catIds = [];
        foreach ($this->d['newsCategories'] as $i => $c) {
            $catIds[$c['slug']] = NewsCategory::query()->create(['slug' => $c['slug'], 'position' => $i + 1, ...$this->loc('name', $c['name'])])->id;
        }

        // Explicit ids keep the public ids ("nw1" …) identical to the demo content.
        foreach ($this->d['news'] as $n) {
            $id = (int) preg_replace('/\D/', '', $n['id']);
            $published = Carbon::parse($n['publishedAt'].' 09:00:00', config('app.timezone'));
            $news = new News([
                'slug' => $n['slug'], 'news_category_id' => $catIds[$n['categorySlug']] ?? null, 'image_url' => $n['image'] ?: null,
                'author_name' => $n['author'] ?? 'Withaq Media Office',
                ...$this->loc('title', $n['title']), ...$this->loc('excerpt', $n['excerpt']), ...$this->loc('content', $n['content']),
            ]);
            $news->forceFill(['id' => $id, 'status' => 'published', 'published_at' => $published, 'reviewed_at' => $published->copy()->subHours(3),
                'created_at' => $published->copy()->subDays(2), 'updated_at' => $published]);
            $news->save();
            $this->seo($news, $n['seo'] ?? null);
        }
    }

    private function offers(): void
    {
        foreach ($this->d['offers'] as $i => $o) {
            Offer::query()->create([
                'slug' => $o['id'], 'href' => $o['href'], 'image_url' => $o['image'] ?: null,
                'starts_at' => $o['startsAt'], 'ends_at' => $o['endsAt'], 'position' => $i + 1, 'status' => 'active',
                ...$this->loc('title', $o['title']), ...$this->loc('details', $o['details']),
            ]);
        }
    }

    private function faqs(): void
    {
        $featured = array_column($this->d['home']['faqs'], 'id');
        foreach ($this->d['faqGroups'] as $ci => $group) {
            $category = FaqCategory::query()->create(['slug' => $group['category']['slug'], 'position' => $ci + 1, ...$this->loc('name', $group['category']['name'])]);
            foreach ($group['items'] as $qi => $q) {
                // Explicit ids keep the public ids ("q1" …) identical to the demo content.
                $faq = new Faq([
                    'faq_category_id' => $category->id, 'is_featured' => in_array($q['id'], $featured, true), 'position' => $qi + 1, 'status' => 'active',
                    ...$this->loc('question', $q['question']), ...$this->loc('answer', $q['answer']),
                ]);
                $faq->forceFill(['id' => (int) preg_replace('/\D/', '', $q['id'])])->save();
            }
        }
    }

    private function jobs(): void
    {
        foreach ($this->d['jobs'] as $i => $j) {
            $job = new Job([
                'slug' => $j['slug'], 'city_id' => $this->city($j['city']['en']), 'employment_type' => $j['employmentType'],
                'closes_at' => $j['closesAt'], 'position' => $i + 1, 'status' => 'active',
                ...$this->loc('title', $j['title']), ...$this->loc('department', $j['department']), ...$this->loc('summary', $j['summary']),
                ...$this->loc('description', $j['description'] ?? null), ...$this->loc('requirements', $j['requirements'] ?? ['ar' => [], 'en' => []]),
            ]);
            $job->forceFill(['id' => (int) preg_replace('/\D/', '', $j['id'])])->save();
        }
    }

    private function pages(): void
    {
        $home = new Page(['slug' => 'home', 'template' => 'home', 'title_ar' => 'الرئيسية', 'title_en' => 'Home',
            'summary_ar' => 'الصفحة الرئيسية للموقع', 'summary_en' => 'Website home page', 'status' => 'published', 'published_at' => now()->subMonths(3)]);
        $home->save();
        foreach (PublicContentQuery::HOME_SECTIONS as $i => $type) {
            $home->sections()->create(['type' => 'home:'.$type, 'data' => [], 'position' => $i + 1, 'is_visible' => true]);
        }

        foreach ($this->d['pages'] as $p) {
            $updated = Carbon::parse($p['updatedAt']);
            $page = new Page([
                'slug' => $p['slug'], 'template' => 'default', 'status' => 'published', 'published_at' => $updated->copy()->subMonth(),
                ...$this->loc('title', $p['title']), ...$this->loc('summary', $p['summary'] ?? null),
            ]);
            $page->save();
            foreach ($p['sections'] as $i => $section) {
                $page->sections()->create([
                    'type' => $section['type'], 'data' => $this->remapMedia($section['data']), 'position' => $i + 1, 'is_visible' => true,
                ]);
            }
            $this->seo($page, $p['seo'] ?? null);
            $page->forceFill(['updated_at' => $updated, 'created_at' => $updated->copy()->subMonths(2)])->saveQuietly();
        }
    }

    /** Fixture MediaRefs point at static files of the web app; register them in the media library. */
    private function remapMedia(mixed $data): mixed
    {
        if (! is_array($data)) {
            return $data;
        }
        if (isset($data['id'], $data['url'], $data['mime']) && is_int($data['id'])) {
            if (! isset($this->mediaMap[$data['id']])) {
                $isPdf = $data['mime'] === 'application/pdf';
                $media = Media::query()->create([
                    'disk' => 'url', 'path' => $data['url'], 'filename' => basename($data['url']), 'original_name' => basename($data['url']),
                    'mime' => $data['mime'], 'kind' => $isPdf ? 'pdf' : (str_starts_with($data['mime'], 'video/') ? 'video' : 'image'),
                    'size' => 0, 'width' => $data['width'] ?? null, 'height' => $data['height'] ?? null,
                    'alt_ar' => $data['alt']['ar'] ?? null, 'alt_en' => $data['alt']['en'] ?? null,
                ]);
                $this->mediaMap[$data['id']] = $media->id;
                if ($isPdf) {
                    Document::query()->create([
                        'title_ar' => $data['alt']['ar'] ?? basename($data['url']), 'title_en' => $data['alt']['en'] ?? basename($data['url']),
                        'media_id' => $media->id, 'category' => str_contains($data['url'], 'report') || preg_match('/q\d-\d{4}/', $data['url']) ? 'report' : 'governance',
                        'year' => preg_match('/(20\d\d)/', $data['url'], $m) ? (int) $m[1] : null, 'status' => 'active',
                    ]);
                }
            }

            return Media::query()->findOrFail($this->mediaMap[$data['id']])->toRef();
        }

        return array_map(fn ($v) => $this->remapMedia($v), $data);
    }

    private function menus(): void
    {
        $header = Menu::query()->create(['location' => 'header', 'name' => 'Header']);
        $items = [
            ['/', 'الرئيسية', 'Home'], ['/about', 'من نحن', 'About'], ['/personal', 'الأفراد', 'Personal'], ['/business', 'الشركات', 'Business'],
            ['/financing', 'التمويل', 'Financing'], ['/digital', 'الخدمات الرقمية', 'Digital'], ['/cards', 'البطاقات', 'Cards'],
            ['/branches', 'الفروع والصرافات', 'Branches & ATMs'], ['/news', 'الأخبار', 'News'], ['/contact', 'تواصل معنا', 'Contact'],
        ];
        foreach ($items as $i => [$href, $ar, $en]) {
            $header->items()->create(['href' => $href, 'label_ar' => $ar, 'label_en' => $en, 'position' => $i + 1]);
        }

        $footer = Menu::query()->create(['location' => 'footer', 'name' => 'Footer']);
        $groups = [
            ['البنك', 'The bank', [['/about', 'عن البنك', 'About'], ['/governance', 'الحوكمة', 'Governance'], ['/news', 'الأخبار', 'News'], ['/careers', 'الوظائف', 'Careers']]],
            ['الخدمات', 'Services', [['/services', 'الخدمات', 'Services'], ['/personal', 'الأفراد', 'Personal'], ['/business', 'الشركات', 'Business'], ['/financing', 'التمويل', 'Financing'], ['/digital', 'الخدمات الرقمية', 'Digital']]],
            ['المساعدة', 'Help', [['/branches', 'الفروع', 'Branches'], ['/contact', 'تواصل معنا', 'Contact us'], ['/complaints', 'الشكاوى', 'Complaints'], ['/privacy', 'الخصوصية', 'Privacy'], ['/terms', 'الشروط والأحكام', 'Terms & conditions']]],
        ];
        foreach ($groups as $gi => [$ar, $en, $children]) {
            $parent = $footer->items()->create(['href' => '#', 'label_ar' => $ar, 'label_en' => $en, 'position' => $gi + 1]);
            foreach ($children as $ci => [$href, $car, $cen]) {
                $footer->items()->create(['parent_id' => $parent->id, 'href' => $href, 'label_ar' => $car, 'label_en' => $cen, 'position' => $ci + 1]);
            }
        }
    }

    private function staticSeo(): void
    {
        $paths = [
            '/branches' => [['الفروع وأجهزة الصراف', 'Branches & ATMs'], ['ابحث عن أقرب فرع أو صراف آلي أو وكيل لبنك وِثاق.', 'Find the nearest Withaq Bank branch, ATM or agent.']],
            '/news' => [['الأخبار', 'News'], ['آخر أخبار بنك وِثاق وإعلاناته.', 'The latest Withaq Bank news and announcements.']],
            '/faq' => [['الأسئلة الشائعة', 'FAQ'], ['إجابات عن أكثر الأسئلة شيوعاً حول خدماتنا.', 'Answers to the most common questions about our services.']],
            '/careers' => [['الوظائف', 'Careers'], ['انضم إلى فريق بنك وِثاق.', 'Join the Withaq Bank team.']],
            '/financing' => [['التمويل', 'Financing'], ['حلول تمويل متوافقة مع الشريعة.', 'Sharia-compliant financing solutions.']],
        ];
        foreach ($paths as $path => [$title, $desc]) {
            SeoMetadata::query()->create(['path' => $path, 'title_ar' => $title[0], 'title_en' => $title[1], 'description_ar' => $desc[0], 'description_en' => $desc[1]]);
        }
    }

    private function banners(): void
    {
        $rows = [
            ['حسابك في دقائق', 'Your account in minutes', 'افتح حسابك من الجوال', 'Open it from your phone', 'home_hero', '/apply/account'],
            ['استرداد نقدي 5%', '5% cashback', 'على مشتريات بطاقة الخصم', 'On debit card purchases', 'home_strip', '/offers/card-cashback'],
            ['التمويل الزراعي', 'Agricultural financing', 'موسم الحصاد يبدأ هنا', 'Harvest season starts here', 'financing_page', '/financing/agricultural'],
        ];
        foreach ($rows as $i => [$tar, $ten, $sar, $sen, $placement, $href]) {
            Banner::query()->create([
                'title_ar' => $tar, 'title_en' => $ten, 'subtitle_ar' => $sar, 'subtitle_en' => $sen, 'placement' => $placement,
                'cta_label_ar' => 'اعرف المزيد', 'cta_label_en' => 'Learn more', 'cta_href' => $href,
                'starts_at' => now()->subDays(10)->toDateString(), 'ends_at' => now()->addDays(60)->toDateString(),
                'position' => $i + 1, 'status' => $i === 2 ? 'inactive' : 'active',
            ]);
        }
    }

    private function seo($model, ?array $seo): void
    {
        if (! $seo) {
            return;
        }
        $model->seo()->create([
            'title_ar' => $seo['title']['ar'] ?? null, 'title_en' => $seo['title']['en'] ?? null,
            'description_ar' => $seo['description']['ar'] ?? null, 'description_en' => $seo['description']['en'] ?? null,
        ]);
    }

    /** Localized / LocalizedList → `{base}_ar`, `{base}_en`. */
    private function loc(string $base, ?array $value): array
    {
        return [$base.'_ar' => $value['ar'] ?? null, $base.'_en' => $value['en'] ?? null];
    }

    private function city(string $en): int
    {
        return $this->cities[$en] ?? throw new RuntimeException("Unknown demo city {$en}");
    }
}

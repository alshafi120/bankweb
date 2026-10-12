<?php

namespace App\Modules\Content\Application\Services;

use App\Modules\Careers\Infrastructure\Models\Job;
use App\Modules\Catalog\Infrastructure\Models\Card;
use App\Modules\Catalog\Infrastructure\Models\FinancingProduct;
use App\Modules\Catalog\Infrastructure\Models\Offer;
use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Catalog\Infrastructure\Models\Service;
use App\Modules\Content\Infrastructure\Models\Faq;
use App\Modules\Content\Infrastructure\Models\FaqCategory;
use App\Modules\Content\Infrastructure\Models\Page;
use App\Modules\Content\Infrastructure\Models\PageSection;
use App\Modules\Network\Infrastructure\Models\Agent;
use App\Modules\Network\Infrastructure\Models\Atm;
use App\Modules\Network\Infrastructure\Models\Branch;
use App\Modules\Network\Infrastructure\Models\City;
use App\Modules\News\Infrastructure\Models\News;
use App\Modules\News\Infrastructure\Models\NewsCategory;
use App\Support\Content\ContentCache;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

/**
 * Read side of the public API. Every method returns plain arrays in contract shape and is cached under
 * a versioned key (ContentCache) that any content change invalidates.
 */
final class PublicContentQuery
{
    public const HOME_SECTIONS = ['hero', 'services', 'needs', 'accounts', 'financing', 'digital', 'cards', 'network', 'news', 'offers', 'why', 'app', 'faq', 'cta'];

    public function __construct(private readonly SiteSettingsService $settings) {}

    public function settings(): array
    {
        return ContentCache::remember('settings', fn () => $this->settings->site());
    }

    public function home(): array
    {
        return ContentCache::remember('home', function () {
            $content = [
                'settings' => $this->settings->site(),
                'services' => array_slice($this->services(), 0, 6),
                'needs' => $this->settings->homeList('needs'),
                'accounts' => $this->accounts(),
                'financing' => array_map(fn (array $f) => array_intersect_key($f, array_flip(['id', 'name', 'summary', 'maxAmount', 'maxMonths', 'annualProfitRate', 'body', 'requirements'])), $this->financing()),
                'digital' => $this->settings->homeList('digital'),
                'cards' => $this->cards(),
                'stats' => $this->settings->homeList('stats'),
                'locations' => $this->allLocations(),
                'news' => array_map(fn (News $n) => PublicContentPresenter::newsItem($n), $this->publishedNews()->limit(4)->get()->all()),
                'offers' => array_slice($this->offers(), 0, 3),
                'reasons' => $this->settings->homeList('reasons'),
                'reasonStats' => $this->settings->homeList('reasonStats'),
                'faqs' => Faq::query()->active()->where('is_featured', true)->ordered()->limit(6)->get()
                    ->map(fn (Faq $f) => PublicContentPresenter::faq($f))->all(),
            ];

            $layout = $this->homeLayout();
            if ($layout !== null) {
                $content['layout'] = $layout;
            }

            return $content;
        });
    }

    /** Ordered visible `home:<type>` sections of the published home page; null → client default order. */
    private function homeLayout(): ?array
    {
        $home = Page::query()->published()->where('slug', 'home')->first();
        if (! $home) {
            return null;
        }
        $types = $home->sections()->live()->get()
            ->map(fn (PageSection $s) => Str::after($s->type, 'home:'))
            ->filter(fn (string $t) => in_array($t, self::HOME_SECTIONS, true))
            ->values()->all();

        return $types === [] ? null : $types;
    }

    public function menu(string $location): array
    {
        return ContentCache::remember('menu:'.$location, function () use ($location) {
            $menu = \App\Modules\Content\Infrastructure\Models\Menu::query()->where('location', $location)->first();

            return $menu ? $menu->tree() : [];
        });
    }

    public function page(string $slug): ?array
    {
        return ContentCache::remember('page:'.$slug, function () use ($slug) {
            $page = Page::query()->published()->where('slug', $slug)
                ->with(['sections' => fn ($q) => $q->live(), 'seo.ogImage'])
                ->first();

            return $page ? PublicContentPresenter::page($page) : null;
        });
    }

    public function services(): array
    {
        return ContentCache::remember('services', fn () => Service::query()->active()->ordered()->get()
            ->map(fn (Service $s) => PublicContentPresenter::service($s))->all());
    }

    public function accounts(?string $type = null): array
    {
        return ContentCache::remember('products:'.($type ?? 'all'), fn () => Product::query()->active()->ordered()
            ->when($type && $type !== 'account', fn ($q) => $q->where('account_type', $type))
            ->get()->map(fn (Product $p) => PublicContentPresenter::account($p))->all());
    }

    public function financing(): array
    {
        return ContentCache::remember('financing', fn () => FinancingProduct::query()->active()->ordered()->get()
            ->map(fn (FinancingProduct $f) => PublicContentPresenter::financing($f))->all());
    }

    public function financingOne(string $slug): ?array
    {
        return ContentCache::remember('financing:'.$slug, function () use ($slug) {
            $f = FinancingProduct::query()->active()->where('slug', $slug)->first();

            return $f ? PublicContentPresenter::financing($f) : null;
        });
    }

    public function cards(): array
    {
        return ContentCache::remember('cards', fn () => Card::query()->active()->ordered()->get()
            ->map(fn (Card $c) => PublicContentPresenter::card($c))->all());
    }

    public function card(string $slug): ?array
    {
        return ContentCache::remember('card:'.$slug, function () use ($slug) {
            $c = Card::query()->active()->where('slug', $slug)->first();

            return $c ? PublicContentPresenter::card($c) : null;
        });
    }

    public function publishedNews(): Builder
    {
        return News::query()->published()->with(['category', 'featuredMedia'])
            ->orderByDesc('published_at')->orderByDesc('id');
    }

    /** @return array{data: list<array>, meta: array} */
    public function newsPage(?string $category, int $page, int $perPage): array
    {
        $key = 'news:list:'.md5(json_encode([$category, $page, $perPage]));

        return ContentCache::remember($key, function () use ($category, $page, $perPage) {
            /** @var LengthAwarePaginator $p */
            $p = $this->publishedNews()
                ->when($category, fn (Builder $q) => $q->whereHas('category', fn (Builder $c) => $c->where('slug', $category)))
                ->paginate($perPage, ['*'], 'page', $page);

            return [
                'data' => array_map(fn (News $n) => PublicContentPresenter::newsItem($n), $p->items()),
                'meta' => ['currentPage' => $p->currentPage(), 'lastPage' => $p->lastPage(), 'perPage' => $p->perPage(), 'total' => $p->total()],
            ];
        });
    }

    public function newsDetail(string $slug): ?array
    {
        return ContentCache::remember('news:'.$slug, function () use ($slug) {
            $n = $this->publishedNews()->with('seo.ogImage')->where('slug', $slug)->first();

            return $n ? PublicContentPresenter::newsDetail($n) : null;
        });
    }

    public function newsCategories(): array
    {
        return ContentCache::remember('news-categories', fn () => NewsCategory::query()->ordered()->get()
            ->map(fn (NewsCategory $c) => PublicContentPresenter::newsCategory($c))->all());
    }

    public function offers(): array
    {
        // Date-dependent: the key includes today so the list rolls over at midnight.
        return ContentCache::remember('offers:'.now()->toDateString(), fn () => Offer::query()->current()->with('media')->ordered()->get()
            ->map(fn (Offer $o) => PublicContentPresenter::offer($o))->all());
    }

    /** @param  class-string<Branch|Atm|Agent>  $model */
    public function locations(string $model, ?string $city = null, ?string $q = null): array
    {
        $key = 'loc:'.class_basename($model).':'.md5(json_encode([$city, $q]));

        return ContentCache::remember($key, function () use ($model, $city, $q) {
            return $model::query()->active()->with('city')->ordered()
                ->when($city, fn (Builder $b) => $b->whereHas('city', fn (Builder $c) => $c->where('slug', $city)
                    ->orWhere('name_en', $city)->orWhere('name_ar', $city)))
                ->when($q, function (Builder $b) use ($q) {
                    $like = '%'.addcslashes($q, '%_\\').'%';
                    $b->where(fn (Builder $w) => $w->where('name_ar', 'like', $like)->orWhere('name_en', 'like', $like)
                        ->orWhere('district_ar', 'like', $like)->orWhere('district_en', 'like', $like)
                        ->orWhere('address_ar', 'like', $like)->orWhere('address_en', 'like', $like));
                })
                ->get()->map(fn (Model $l) => $l->toLocation())->all();
        });
    }

    /** Cities for selects (`{id, slug, name}`), ordered by id to match the admin's fixed CITY_OPTIONS. */
    public function cities(): array
    {
        return ContentCache::remember('cities', fn () => City::query()->orderBy('id')->get()
            ->map(fn (City $c) => ['id' => $c->id, 'slug' => $c->slug, 'name' => $c->localized('name')])->all());
    }

    public function allLocations(): array
    {
        return [...$this->locations(Branch::class), ...$this->locations(Atm::class), ...$this->locations(Agent::class)];
    }

    public function faqGroups(): array
    {
        return ContentCache::remember('faqs', fn () => FaqCategory::query()->ordered()
            ->with(['faqs' => fn ($q) => $q->active()->ordered()])->get()
            ->filter(fn (FaqCategory $c) => $c->faqs->isNotEmpty())
            ->map(fn (FaqCategory $c) => [
                'category' => ['slug' => $c->slug, 'name' => $c->localized('name')],
                'items' => $c->faqs->map(fn (Faq $f) => PublicContentPresenter::faq($f))->values()->all(),
            ])->values()->all());
    }

    public function jobs(): array
    {
        return ContentCache::remember('jobs:'.now()->toDateString(), fn () => Job::query()->open()->with('city')->ordered()->get()
            ->map(fn (Job $j) => PublicContentPresenter::job($j))->all());
    }

    public function job(string $slug): ?array
    {
        return ContentCache::remember('job:'.$slug.':'.now()->toDateString(), function () use ($slug) {
            $j = Job::query()->open()->with('city')->where('slug', $slug)->first();

            return $j ? PublicContentPresenter::job($j, true) : null;
        });
    }

    /** Locale-less paths for the sitemap. */
    public function sitemap(): array
    {
        return ContentCache::remember('sitemap', function () {
            $iso = fn ($d) => ($d ?? now())->toIso8601String();
            $entries = [];
            $static = ['/', '/personal', '/business', '/services', '/accounts', '/financing', '/cards', '/offers',
                '/branches', '/atms', '/agents', '/news', '/faq', '/careers', '/contact', '/complaints'];
            $latestNews = News::query()->published()->max('updated_at');
            $latest = $iso($latestNews ? \Illuminate\Support\Carbon::parse($latestNews) : null);
            foreach ($static as $path) {
                $entries[] = ['path' => $path, 'updatedAt' => $latest];
            }
            foreach (Page::query()->published()->where('slug', '!=', 'home')->get(['slug', 'updated_at']) as $p) {
                $entries[] = ['path' => '/'.$p->slug, 'updatedAt' => $iso($p->updated_at)];
            }
            foreach ($this->publishedNews()->get(['news.id', 'slug', 'news_category_id', 'featured_media_id', 'updated_at', 'published_at']) as $n) {
                $entries[] = ['path' => '/news/'.$n->slug, 'updatedAt' => $iso($n->updated_at)];
            }
            foreach (Job::query()->open()->get(['slug', 'updated_at']) as $j) {
                $entries[] = ['path' => '/careers/'.$j->slug, 'updatedAt' => $iso($j->updated_at)];
            }
            foreach (Product::query()->active()->get(['slug', 'updated_at']) as $p) {
                $entries[] = ['path' => '/accounts/'.$p->slug, 'updatedAt' => $iso($p->updated_at)];
            }
            foreach (FinancingProduct::query()->active()->get(['slug', 'updated_at']) as $f) {
                $entries[] = ['path' => '/financing/'.$f->slug, 'updatedAt' => $iso($f->updated_at)];
            }
            foreach (Card::query()->active()->get(['slug', 'updated_at']) as $c) {
                $entries[] = ['path' => '/cards/'.$c->slug, 'updatedAt' => $iso($c->updated_at)];
            }

            return $entries;
        });
    }
}

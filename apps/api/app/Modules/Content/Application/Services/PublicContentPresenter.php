<?php

namespace App\Modules\Content\Application\Services;

use App\Modules\Careers\Infrastructure\Models\Job;
use App\Modules\Catalog\Infrastructure\Models\Card;
use App\Modules\Catalog\Infrastructure\Models\FinancingProduct;
use App\Modules\Catalog\Infrastructure\Models\Offer;
use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Catalog\Infrastructure\Models\Service;
use App\Modules\Content\Infrastructure\Models\Faq;
use App\Modules\Content\Infrastructure\Models\Page;
use App\Modules\Content\Infrastructure\Models\PageSection;
use App\Modules\News\Infrastructure\Models\News;
use App\Modules\News\Infrastructure\Models\NewsCategory;

/**
 * Maps Eloquent models to the exact public contract shapes of packages/api-types (camelCase, Localized).
 * Pure mapping, no queries beyond already-loaded relations (callers eager-load).
 */
final class PublicContentPresenter
{
    public static function service(Service $s, bool $withBody = false): array
    {
        $out = [
            'id' => $s->slug,
            'icon' => $s->icon,
            'title' => $s->localized('title'),
            'summary' => $s->localized('summary'),
            'href' => $s->href,
        ];
        if ($withBody) {
            $out['body'] = $s->localizedOrNull('body');
        }

        return $out;
    }

    public static function account(Product $p): array
    {
        return [
            'id' => $p->slug,
            'accountType' => $p->account_type,
            'name' => $p->localized('name'),
            'tagline' => $p->localized('tagline'),
            'features' => $p->localizedList('features'),
            'requirements' => $p->localizedList('requirements'),
            'minimumBalance' => $p->minimum_balance,
            'currency' => 'YER',
            'href' => '/accounts/'.$p->slug,
        ];
    }

    public static function financing(FinancingProduct $f, bool $detail = true): array
    {
        $out = [
            'id' => $f->slug,
            'name' => $f->localized('name'),
            'summary' => $f->localized('summary'),
            'maxAmount' => (int) $f->max_amount,
            'maxMonths' => (int) $f->max_months,
            'annualProfitRate' => self::number($f->annual_profit_rate),
        ];
        if ($detail) {
            $out['body'] = $f->localizedOrNull('body');
            $out['requirements'] = $f->localizedList('requirements');
        }

        return $out;
    }

    public static function card(Card $c, bool $detail = true): array
    {
        $out = [
            'id' => $c->slug,
            'name' => $c->localized('name'),
            'summary' => $c->localized('summary'),
            'network' => $c->network,
            'tone' => $c->tone,
        ];
        if ($detail) {
            $out['features'] = $c->localizedList('features');
            $out['fees'] = $c->localizedOrNull('fees');
        }

        return $out;
    }

    public static function newsItem(News $n): array
    {
        $category = $n->category;

        return [
            'id' => 'nw'.$n->id,
            'slug' => $n->slug,
            'title' => $n->localized('title'),
            'excerpt' => $n->localized('excerpt'),
            'category' => $category ? $category->localized('name') : ['ar' => '', 'en' => ''],
            'categorySlug' => $category?->slug,
            'publishedAt' => $n->published_at?->toDateString() ?? '',
            'image' => $n->imageUrl(),
        ];
    }

    public static function newsDetail(News $n): array
    {
        return self::newsItem($n) + [
            'content' => $n->localized('content'),
            'author' => (string) ($n->author_name ?: config('app.name')),
            'seo' => $n->seoPayload($n->localized('title'), $n->localized('excerpt')),
        ];
    }

    public static function newsCategory(NewsCategory $c): array
    {
        return ['slug' => $c->slug, 'name' => $c->localized('name')];
    }

    public static function offer(Offer $o): array
    {
        return [
            'id' => $o->slug,
            'title' => $o->localized('title'),
            'details' => $o->localized('details'),
            'startsAt' => $o->starts_at?->toDateString() ?? '',
            'endsAt' => $o->ends_at?->toDateString() ?? '',
            'image' => $o->imageUrl(),
            'href' => (string) ($o->href ?? '/offers'),
        ];
    }

    public static function faq(Faq $f): array
    {
        return [
            'id' => 'q'.$f->id,
            'question' => $f->localized('question'),
            'answer' => $f->localized('answer'),
        ];
    }

    public static function job(Job $j, bool $detail = false): array
    {
        $out = [
            'id' => 'j'.$j->id,
            'slug' => $j->slug,
            'title' => $j->localized('title'),
            'department' => $j->localized('department'),
            'city' => $j->city ? $j->city->localized('name') : ['ar' => '', 'en' => ''],
            'employmentType' => $j->employment_type,
            'closesAt' => $j->closes_at?->toDateString() ?? '',
            'summary' => $j->localized('summary'),
        ];
        if ($detail) {
            // Optional in the contract: omitted when empty (matches the web demo data).
            if ($description = $j->localizedOrNull('description')) {
                $out['description'] = $description;
            }
            $out['requirements'] = $j->localizedList('requirements');
        }

        return $out;
    }

    /** Contract `CmsPage`: only live sections, in order. */
    public static function page(Page $page): array
    {
        return [
            'slug' => $page->slug,
            'title' => $page->localized('title'),
            'summary' => $page->localizedOrNull('summary'),
            'seo' => $page->seoPayload($page->localized('title'), $page->localized('summary')),
            'sections' => $page->sections
                ->filter(fn (PageSection $s) => ! str_starts_with($s->type, 'home:'))
                ->map(fn (PageSection $s) => ['id' => $s->id, 'type' => $s->type, 'data' => $s->data ?? (object) []])
                ->values()->all(),
            'updatedAt' => ($page->updated_at ?? now())->toIso8601String(),
        ];
    }

    /** 99.9 stays float, 9.0 becomes 9 (matches the demo JSON). */
    public static function number(mixed $value): int|float
    {
        $f = (float) $value;

        return floor($f) === $f ? (int) $f : $f;
    }
}

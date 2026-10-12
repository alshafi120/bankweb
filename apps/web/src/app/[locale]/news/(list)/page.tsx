import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import { getNews, getNewsCategories } from "@/lib/api/client";
import { firstParam, pageParam } from "@/lib/content";
import { href } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/config";
import { metaLocale, resolve, type LocaleParams, type SearchParams } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { NewsCard, NewsLead } from "@/components/news/NewsCards";

const PER_PAGE = 7; // lead + 6 in the grid

export async function generateMetadata({ params, searchParams }: { params: LocaleParams; searchParams: SearchParams }): Promise<Metadata> {
  const { locale, dict } = await metaLocale(params);
  const sp = await searchParams;
  const meta = pageMetadata({ locale, path: "/news", title: dict.pages.news.title, description: dict.pages.news.summary });
  // Filtered/paged views canonicalise to the main listing.
  return firstParam(sp.category) || pageParam(sp.page) > 1 ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export default async function NewsPage({ params, searchParams }: { params: LocaleParams; searchParams: SearchParams }) {
  const { locale, dict } = await resolve(params);
  const sp = await searchParams;
  const categories = await getNewsCategories();
  const requested = firstParam(sp.category);
  const category = categories.some((c) => c.slug === requested) ? requested : "";
  const page = pageParam(sp.page);
  const news = await getNews({ category: category || undefined, page, perPage: PER_PAGE });
  const [lead, ...rest] = news.data;

  const build = (p: number, cat = category) => {
    const q = new URLSearchParams();
    if (cat) q.set("category", cat);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return href(locale, `/news${s ? `?${s}` : ""}`);
  };
  const chip = (active: boolean) => clsx("inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold transition",
    active ? "border-brand-900 bg-brand-900 text-white" : "border-line bg-surface hover:border-brand-700 hover:text-brand-700");

  return (
    <>
      <PageHeader locale={locale} dict={dict} title={dict.pages.news.title} summary={dict.pages.news.summary} crumbs={[{ label: dict.pages.news.title }]} />
      <div className="container py-10 md:py-14">
        <nav aria-label={dict.newsPage.categories} className="-mx-4 mb-8 overflow-x-auto px-4">
          <ul className="flex w-max gap-2">
            <li><Link href={build(1, "")} className={chip(!category)} aria-current={!category ? "page" : undefined}>{dict.newsPage.allCategories}</Link></li>
            {categories.map((c) => (
              <li key={c.slug}><Link href={build(1, c.slug)} className={chip(category === c.slug)} aria-current={category === c.slug ? "page" : undefined}>{t(c.name, locale)}</Link></li>
            ))}
          </ul>
        </nav>

        {!lead && <p className="rounded-card border border-dashed border-line p-10 text-center text-muted">{dict.newsPage.empty}</p>}
        {lead && news.meta.currentPage === 1 && <NewsLead item={lead} locale={locale} dict={dict} />}
        {lead && (
          <ul className={clsx("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", news.meta.currentPage === 1 && "mt-10")}>
            {(news.meta.currentPage === 1 ? rest : news.data).map((n) => <li key={n.id}><NewsCard item={n} locale={locale} headingLevel="h2" /></li>)}
          </ul>
        )}
        <Pagination meta={news.meta} build={(p) => build(p)} dict={dict} label={dict.newsPage.pagination} />
      </div>
    </>
  );
}

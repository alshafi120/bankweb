import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";
import { getAccounts, getCards, getFinancingProducts, getJobs, getNews, getSitemapEntries } from "@/lib/api/client";
import { CMS_PAGE_SLUGS } from "@/content/demo/pages";
import { siteUrl } from "@/lib/seo";

// Rendered on request so SITE_URL (runtime env) and freshly published content are always used; API calls are cached.
export const dynamic = "force-dynamic";

const STATIC = ["", "/personal", "/business", "/services", "/accounts", "/financing", "/cards", "/offers",
  "/branches", "/atms", "/agents", "/news", "/faq", "/careers", "/contact", "/complaints"];

/**
 * Sitemap from GET /api/v1/sitemap (locale-less paths) — or, when the API is unavailable,
 * every static route + CMS pages + news, jobs and products from the demo/catalog data. hreflang on each entry.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = siteUrl();
  let entries: { path: string; updatedAt?: string }[];

  const api = await getSitemapEntries();
  if (api.ok && api.data.length) {
    entries = api.data;
  } else {
    const [news, jobs, accounts, financing, cards] = await Promise.all([getNews({ perPage: 1000 }), getJobs(), getAccounts(), getFinancingProducts(), getCards()]);
    entries = [
      ...STATIC.map((path) => ({ path })),
      ...CMS_PAGE_SLUGS.map((s) => ({ path: `/${s}` })),
      ...news.data.map((n) => ({ path: `/news/${n.slug}`, updatedAt: n.publishedAt })),
      ...jobs.map((j) => ({ path: `/careers/${j.slug}` })),
      ...accounts.map((a) => ({ path: `/accounts/${a.id}` })),
      ...financing.map((f) => ({ path: `/financing/${f.id}` })),
      ...cards.map((c) => ({ path: `/cards/${c.id}` })),
    ];
  }

  const norm = (p: string) => (p === "/" ? "" : p);
  return entries.flatMap(({ path, updatedAt }) => locales.map((l) => ({
    url: `${site}/${l}${norm(path)}`,
    lastModified: updatedAt ? new Date(updatedAt) : undefined,
    alternates: { languages: { ...Object.fromEntries(locales.map((x) => [x, `${site}/${x}${norm(path)}`])), "x-default": `${site}/ar${norm(path)}` } },
  })));
}

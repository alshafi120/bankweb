import "server-only";
import type {
  AccountProduct, CardProduct, CmsPage, FaqGroup, FinancingProduct, HomeContent, Job, Location, MenuItem,
  NewsCategory, NewsDetail, NewsItem, Offer, Paginated, Service, ServiceType, SiteSettings,
} from "@/types/content";
import { demoHome } from "@/content/demo/home";
import { demoAccounts, demoCards, demoFinancing, demoLocations, demoOffers, demoServices } from "@/content/demo/catalog";
import { demoNews, demoNewsCategories } from "@/content/demo/news";
import { demoFaqGroups, demoJobs } from "@/content/demo/jobs";
import { demoPages } from "@/content/demo/pages";
import { activeOffers, paginate, todayIso, toNewsItem } from "@/lib/content";

const BASE = process.env.API_BASE_URL;
const REVALIDATE = 300;

/** Whether the site is talking to a real API (false → demo content, demo form submissions). */
export const apiConfigured = () => Boolean(BASE);

type Result<T> = { ok: true; data: T; meta?: Paginated<unknown>["meta"] } | { ok: false; notFound: boolean };

/**
 * Typed read-only client for the public API (/api/v1).
 * Server-side only: the base URL and any credentials never reach the browser.
 * ISR: every response is cached for 5 minutes and tagged; the CMS calls /api/revalidate on publish.
 * Falls back to demo content when no API is configured or it is unreachable,
 * but a real 404 from the API stays a 404 (never masked by demo data).
 */
async function get<T>(path: string, tags: string[]): Promise<Result<T>> {
  if (!BASE) return { ok: false, notFound: false };
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE, tags },
    });
    if (!res.ok) return { ok: false, notFound: res.status === 404 };
    const body = (await res.json()) as { data: T; meta?: Paginated<unknown>["meta"] };
    return { ok: true, data: body.data, meta: body.meta };
  } catch {
    return { ok: false, notFound: false };
  }
}

async function list<T>(path: string, tags: string[], fallback: () => T): Promise<T> {
  const r = await get<T>(path, tags);
  return r.ok ? r.data : fallback();
}

async function one<T>(path: string, tags: string[], fallback: () => T | undefined): Promise<T | null> {
  const r = await get<T>(path, tags);
  if (r.ok) return r.data;
  if (r.notFound) return null;
  return fallback() ?? null;
}

const qs = (params: Record<string, string | number | undefined | null>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
};

/* ───────── Site ───────── */

export const getHomeContent = () => list<HomeContent>("/pages/home/content", ["home"], () => demoHome);

export const getSettings = () => list<SiteSettings>("/settings", ["settings"], () => ({
  ...demoHome.settings,
  // Public Turnstile key for local testing only (the real one comes from CMS settings).
  turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || null,
}));

export const getMenu = (location: "header" | "footer") => list<MenuItem[]>(`/menus/${location}`, ["menus"], () => []);

export const getPage = (slug: string) =>
  one<CmsPage>(`/pages/${encodeURIComponent(slug)}`, ["pages", `page:${slug}`], () => demoPages.find((p) => p.slug === slug));

export const getSitemapEntries = () => get<{ path: string; updatedAt: string }[]>("/sitemap", ["sitemap"]);

/* ───────── Catalog ───────── */

export const getServices = () => list<Service[]>("/services", ["services"], () => demoServices);

export const getAccounts = () => list<AccountProduct[]>("/products?type=account", ["products"], () => demoAccounts);
export const getAccount = async (id: string) => (await getAccounts()).find((a) => a.id === id) ?? null;

export const getFinancingProducts = () => list<FinancingProduct[]>("/financing", ["financing"], () => demoFinancing);
export const getFinancingProduct = (id: string) =>
  one<FinancingProduct>(`/financing/${encodeURIComponent(id)}`, ["financing", `financing:${id}`], () => demoFinancing.find((p) => p.id === id));

export const getCards = () => list<CardProduct[]>("/cards", ["cards"], () => demoCards);
export const getCard = (id: string) =>
  one<CardProduct>(`/cards/${encodeURIComponent(id)}`, ["cards", `card:${id}`], () => demoCards.find((c) => c.id === id));

/** API already returns active offers only; the filter is re-applied as a guard (and for demo data). */
export const getOffers = async () => activeOffers(await list<Offer[]>("/offers", ["offers"], () => demoOffers), todayIso());

/* ───────── Network ───────── */

const NETWORK_PATH: Record<ServiceType, string> = { branch: "/branches", atm: "/atms", agent: "/agents" };

export const getLocations = (type: ServiceType, filters: { city?: string; q?: string } = {}) =>
  list<Location[]>(`${NETWORK_PATH[type]}${qs(filters)}`, ["network"], () => demoLocations.filter((l) => l.type === type));

export const getAllLocations = async () => (await Promise.all((["branch", "atm", "agent"] as const).map((t) => getLocations(t)))).flat();

/* ───────── News ───────── */

export async function getNews({ category, page = 1, perPage = 7 }: { category?: string; page?: number; perPage?: number } = {}): Promise<Paginated<NewsItem>> {
  const r = await get<NewsItem[]>(`/news${qs({ category, page, perPage })}`, ["news"]);
  if (r.ok && r.meta) return { data: r.data, meta: r.meta };
  const items = demoNews.filter((n) => !category || n.categorySlug === category).map(toNewsItem);
  return paginate(items, page, perPage);
}

export const getNewsArticle = (slug: string) =>
  one<NewsDetail>(`/news/${encodeURIComponent(slug)}`, ["news", `news:${slug}`], () => demoNews.find((n) => n.slug === slug));

export const getNewsCategories = () => list<NewsCategory[]>("/news-categories", ["news"], () => demoNewsCategories);

/* ───────── Help & careers ───────── */

export const getFaqGroups = () => list<FaqGroup[]>("/faqs", ["faqs"], () => demoFaqGroups);

export const getJobs = () => list<Job[]>("/jobs", ["jobs"], () => demoJobs);
export const getJob = (slug: string) =>
  one<Job>(`/jobs/${encodeURIComponent(slug)}`, ["jobs", `job:${slug}`], () => demoJobs.find((j) => j.slug === slug));

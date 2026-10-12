import type { NewsDetail, NewsItem, Offer } from "@/types/content";

/** Pure content helpers shared by the API client's demo fallbacks and pages. */

export const todayIso = () => new Date().toISOString().slice(0, 10);

/** Active = startsAt ≤ today ≤ endsAt (API contract for GET /offers). */
export const activeOffers = (offers: Offer[], today = todayIso()) =>
  offers.filter((o) => o.startsAt.slice(0, 10) <= today && today <= o.endsAt.slice(0, 10));

export const toNewsItem = ({ content: _c, author: _a, seo: _s, ...item }: NewsDetail): NewsItem => item;

export function paginate<T>(items: T[], page: number, perPage: number) {
  const total = items.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(Math.max(1, page), lastPage);
  return { data: items.slice((currentPage - 1) * perPage, currentPage * perPage), meta: { currentPage, lastPage, perPage, total } };
}

/** Parse a `?page=` style param into a positive integer. */
export const pageParam = (v: string | string[] | undefined) => {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isInteger(n) && n > 0 ? n : 1;
};

export const firstParam = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

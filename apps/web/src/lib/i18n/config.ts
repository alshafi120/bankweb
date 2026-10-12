import type { Locale, Localized } from "@/types/content";

export const locales = ["ar", "en"] as const satisfies readonly Locale[];
export const defaultLocale: Locale = "ar";

export const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v);
export const dirOf = (l: Locale) => (l === "ar" ? "rtl" : "ltr");
export const t = (value: Localized, l: Locale) => value[l];

/** Prefix an internal path with the locale. External URLs are returned unchanged. */
export const href = (l: Locale, path: string) => (/^https?:/.test(path) ? path : `/${l}${path === "/" ? "" : path}`);

/** Latin digits by default for banking clarity; grouping per locale. */
export const formatNumber = (n: number, l: Locale, opts: Intl.NumberFormatOptions = {}) =>
  new Intl.NumberFormat(l === "ar" ? "ar-YE-u-nu-latn" : "en-US", { maximumFractionDigits: 0, ...opts }).format(n);

export const formatMoney = (n: number, l: Locale) => `${formatNumber(n, l)} ${l === "ar" ? "ر.ي" : "YER"}`;

export const formatDate = (iso: string, l: Locale) =>
  new Intl.DateTimeFormat(l === "ar" ? "ar-YE-u-nu-latn" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

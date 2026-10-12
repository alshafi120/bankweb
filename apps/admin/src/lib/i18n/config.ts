import type { Locale, Localized } from "@/types/api";

export const locales = ["ar", "en"] as const satisfies readonly Locale[];
export const defaultLocale: Locale = "ar";

export const isLocale = (v: string | undefined | null): v is Locale => !!v && (locales as readonly string[]).includes(v);
export const dirOf = (l: Locale) => (l === "ar" ? "rtl" : "ltr");
export const other = (l: Locale): Locale => (l === "ar" ? "en" : "ar");

/** Read a bilingual value, falling back to the other language when one side is empty. */
export const tl = (value: Partial<Localized> | null | undefined, l: Locale): string =>
  (value?.[l] || value?.[other(l)] || "").toString();

const numLocale = (l: Locale) => (l === "ar" ? "ar-YE-u-nu-latn" : "en-US");

/** Latin digits by default for banking clarity (docs/DESIGN-SYSTEM.md). */
export const formatNumber = (n: number, l: Locale, opts: Intl.NumberFormatOptions = {}) =>
  new Intl.NumberFormat(numLocale(l), { maximumFractionDigits: 2, ...opts }).format(n);

export const formatCompact = (n: number, l: Locale) =>
  new Intl.NumberFormat(numLocale(l), { notation: "compact", maximumFractionDigits: 1 }).format(n);

export const formatMoney = (n: number, l: Locale) => `${formatNumber(n, l, { maximumFractionDigits: 0 })} ${l === "ar" ? "ر.ي" : "YER"}`;

export const formatBytes = (bytes: number, l: Locale) => {
  const units = l === "ar" ? ["بايت", "ك.ب", "م.ب", "ج.ب"] : ["B", "KB", "MB", "GB"];
  let i = 0; let v = bytes;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${formatNumber(v, l, { maximumFractionDigits: i === 0 ? 0 : 1 })} ${units[i]}`;
};

export const formatDate = (iso: string | null | undefined, l: Locale) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(l === "ar" ? "ar-YE-u-nu-latn" : "en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
};

export const formatDateTime = (iso: string | null | undefined, l: Locale) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(l === "ar" ? "ar-YE-u-nu-latn" : "en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
};

export const formatRelative = (iso: string, l: Locale) => {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(l === "ar" ? "ar-u-nu-latn" : "en", { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  return formatDate(iso, l);
};

/** Locale-prefixed admin path. */
export const lp = (l: Locale, path = "") => `/${l}${path === "/" ? "" : path}`;

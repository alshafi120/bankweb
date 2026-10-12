import type { Metadata } from "next";
import type { Locale, Seo } from "@/types/content";
import { locales, t } from "@/lib/i18n/config";

export const siteUrl = () => process.env.SITE_URL ?? "http://localhost:3000";
export const bankName = (l: Locale) => (l === "ar" ? "بنك وثاق" : "Withaq Bank");

/** `/about` → `/ar/about`; `/` → `/ar`. */
export const localePath = (l: Locale, path: string) => `/${l}${path === "/" ? "" : path}`;

/**
 * Per-page metadata: title, description, canonical, hreflang (ar/en/x-default), Open Graph and Twitter.
 * `seo` from the CMS wins over the fallback title/description when present.
 */
export function pageMetadata({ locale, path, title, description, seo, type = "website", publishedTime }: {
  locale: Locale; path: string; title: string; description?: string | null; seo?: Seo | null;
  type?: "website" | "article"; publishedTime?: string;
}): Metadata {
  const finalTitle = (seo && t(seo.title, locale)) || title;
  const finalDescription = (seo && t(seo.description, locale)) || description || undefined;
  const canonical = seo?.canonical || localePath(locale, path);
  const ogImage = seo?.ogImage ? [{ url: seo.ogImage.url, alt: t(seo.ogImage.alt, locale) }] : undefined;
  return {
    title: finalTitle,
    description: finalDescription,
    keywords: seo?.keywords ? t(seo.keywords, locale) : undefined,
    robots: seo?.noindex ? { index: false, follow: true } : undefined,
    alternates: {
      canonical,
      languages: { ...Object.fromEntries(locales.map((l) => [l, localePath(l, path)])), "x-default": localePath("ar", path) },
    },
    openGraph: {
      type, url: localePath(locale, path), siteName: bankName(locale), title: finalTitle, description: finalDescription,
      locale: locale === "ar" ? "ar_YE" : "en_US", alternateLocale: locale === "ar" ? "en_US" : "ar_YE",
      images: ogImage, ...(type === "article" && publishedTime ? { publishedTime } : {}),
    },
    twitter: { card: "summary_large_image", title: finalTitle, description: finalDescription, images: ogImage?.map((i) => i.url) },
  };
}

export interface Crumb { label: string; path?: string }

export function breadcrumbJsonLd(locale: Locale, crumbs: Crumb[]) {
  const site = siteUrl();
  return {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem", position: i + 1, name: c.label,
      ...(c.path ? { item: `${site}${localePath(locale, c.path)}` } : {}),
    })),
  };
}

/** Serialise JSON-LD safely inside a <script> (no `</script>` break-out). */
export const jsonLdString = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

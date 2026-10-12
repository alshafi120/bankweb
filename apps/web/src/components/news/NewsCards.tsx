import Link from "next/link";
import type { Locale, NewsItem } from "@/types/content";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatDate, href, t } from "@/lib/i18n/config";
import { CoverArt } from "@/components/ui/CoverArt";
import { Icon } from "@/components/ui/Icon";

export function NewsMeta({ date, category, locale }: { date: string; category: string; locale: Locale }) {
  return (
    <p className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
      <span className="rounded-full bg-brand-100 px-2 py-0.5 font-semibold text-brand-700">{category}</span>
      <time dateTime={date}>{formatDate(date, locale)}</time>
    </p>
  );
}

/** Lead story: the one container that takes the arch top (design system rule). */
export function NewsLead({ item, locale, dict, headingLevel = "h2" }: { item: NewsItem; locale: Locale; dict: Dictionary; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  return (
    <article className="group">
      <Link href={href(locale, `/news/${item.slug}`)} className="grid gap-4 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-10">
        <CoverArt seed={item.id} label={t(item.category, locale)} className="aspect-[16/10] rounded-[20px] lg:rounded-t-[999px]" />
        <div className="grid gap-3">
          <NewsMeta date={item.publishedAt} category={t(item.category, locale)} locale={locale} />
          <H className="text-2xl font-bold group-hover:text-brand-700 md:text-3xl">{t(item.title, locale)}</H>
          <p className="text-muted">{t(item.excerpt, locale)}</p>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">{dict.news.readMore}<Icon name="arrow" className="size-4" directional /></span>
        </div>
      </Link>
    </article>
  );
}

export function NewsCard({ item, locale, headingLevel = "h3" }: { item: NewsItem; locale: Locale; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  return (
    <article className="group h-full">
      <Link href={href(locale, `/news/${item.slug}`)} className="flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface transition duration-200 ease-bank hover:-translate-y-0.5 hover:shadow-lift">
        <CoverArt seed={item.id} className="aspect-[16/9]" />
        <div className="grid flex-1 content-start gap-2 p-5">
          <NewsMeta date={item.publishedAt} category={t(item.category, locale)} locale={locale} />
          <H className="font-semibold leading-snug group-hover:text-brand-700">{t(item.title, locale)}</H>
          <p className="line-clamp-2 text-sm text-muted">{t(item.excerpt, locale)}</p>
        </div>
      </Link>
    </article>
  );
}

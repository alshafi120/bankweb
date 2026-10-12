import Link from "next/link";
import type { SectionProps } from "./types";
import { formatDate, href, t } from "@/lib/i18n/config";
import { ButtonLink, Section, SectionHeader } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import { Counter } from "@/components/widgets/Counter";
import { BranchFinder } from "@/components/widgets/BranchFinder";
import { CoverArt } from "@/components/ui/CoverArt";
import { NewsMeta } from "@/components/news/NewsCards";

export function Network({ content, locale, dict }: SectionProps) {
  return (
    <Section id="network">
      <SectionHeader eyebrow={dict.network.eyebrow} title={dict.network.title} />
      <dl className="mb-10 grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-line bg-line md:grid-cols-4">
        {content.stats.map((s) => (
          <div key={s.id} className="flex flex-col-reverse gap-1 bg-surface p-5 md:p-6">
            <dt className="text-sm text-muted">{t(s.label, locale)}</dt>
            <dd className="font-mono text-3xl font-semibold text-brand-900 dark:text-white md:text-4xl"><Counter value={s.value} suffix={s.suffix} locale={locale} /></dd>
          </div>
        ))}
      </dl>
      <BranchFinder locations={content.locations} locale={locale} dict={dict} />
    </Section>
  );
}

export function News({ content, locale, dict }: SectionProps) {
  const [lead, ...rest] = content.news;
  if (!lead) return null;
  return (
    <Section id="news" className="bg-surface">
      <SectionHeader eyebrow={dict.news.eyebrow} title={dict.news.title}
        action={<ButtonLink href={href(locale, "/news")} variant="ghost" arrow>{dict.news.all}</ButtonLink>} />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <article className="group">
          <Link href={href(locale, `/news/${lead.slug}`)} className="grid gap-4">
            <CoverArt seed={lead.id} label={t(lead.category, locale)} className="aspect-[16/10] rounded-[20px]" />
            <NewsMeta date={lead.publishedAt} category={t(lead.category, locale)} locale={locale} />
            <h3 className="text-2xl font-bold group-hover:text-brand-700">{t(lead.title, locale)}</h3>
            <p className="text-muted">{t(lead.excerpt, locale)}</p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">{dict.news.readMore}<Icon name="arrow" className="size-4" directional /></span>
          </Link>
        </article>
        <ul className="grid content-start gap-5">
          {rest.slice(0, 3).map((n) => (
            <li key={n.id}>
              <Link href={href(locale, `/news/${n.slug}`)} className="group grid grid-cols-[112px_1fr] gap-4 sm:grid-cols-[150px_1fr]">
                <CoverArt seed={n.id} className="aspect-square rounded-card sm:aspect-[4/3]" />
                <div className="grid content-start gap-1.5">
                  <NewsMeta date={n.publishedAt} category={t(n.category, locale)} locale={locale} />
                  <h3 className="font-semibold leading-snug group-hover:text-brand-700">{t(n.title, locale)}</h3>
                  <p className="line-clamp-2 text-sm text-muted">{t(n.excerpt, locale)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

export function Offers({ content, locale, dict }: SectionProps) {
  const o = dict.offers;
  return (
    <Section id="offers">
      <SectionHeader eyebrow={o.eyebrow} title={o.title} />
      <ul className="grid gap-5 md:grid-cols-3">
        {content.offers.map((offer) => (
          <li key={offer.id} className="flex flex-col overflow-hidden rounded-card border border-line bg-surface">
            <CoverArt seed={offer.id} tone="accent" className="aspect-[16/9]" />
            <div className="flex flex-1 flex-col gap-2 p-5">
              <p className="text-[13px] text-muted">
                {o.from} <time dateTime={offer.startsAt}>{formatDate(offer.startsAt, locale)}</time> {o.to} <time dateTime={offer.endsAt}>{formatDate(offer.endsAt, locale)}</time>
              </p>
              <h3 className="text-lg font-semibold">{t(offer.title, locale)}</h3>
              <p className="flex-1 text-[15px] text-muted">{t(offer.details, locale)}</p>
              <ButtonLink href={href(locale, offer.href)} variant="ghost" className="mt-3 self-start" arrow>{o.cta}</ButtonLink>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

import Link from "next/link";
import clsx from "clsx";
import type { ComponentType } from "react";
import type { BlockDataMap, BlockType, Locale, MediaRef, PageSection } from "@/types/content";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatNumber, href, t } from "@/lib/i18n/config";
import { getAllLocations, getLocations } from "@/lib/api/client";
import { ButtonLink, IconBadge, Section, SectionHeader } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import { RichText } from "@/components/ui/RichText";
import { Avatar } from "@/components/ui/Avatar";
import { Counter } from "@/components/widgets/Counter";
import { BranchFinder } from "@/components/widgets/BranchFinder";
import { FaqList } from "@/components/sections/FaqList";

/**
 * CMS page builder renderer: PageSection.type → component.
 * One component per BlockDataMap key; adding a block type without a renderer fails type-checking.
 */
interface BlockProps<K extends BlockType> { data: BlockDataMap[K]; locale: Locale; dict: Dictionary; anchor?: string; alt: boolean }

/** Stable anchor from the English heading ("Send" → #send) so links like /transfers#send keep working. */
const anchorOf = (heading?: { en: string } | null) =>
  heading?.en ? heading.en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || undefined : undefined;

const bg = (alt: boolean) => (alt ? "bg-surface" : undefined);

function Media({ media, locale, className, sizes = "100vw" }: { media: MediaRef; locale: Locale; className?: string; sizes?: string }) {
  // Plain <img>: CMS media is already served in optimised variants from the CDN (and demo art is SVG).
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={media.url} alt={t(media.alt, locale)} width={media.width ?? undefined} height={media.height ?? undefined} loading="lazy" decoding="async" sizes={sizes} className={className} />;
}

function HeroBlock({ data, locale }: BlockProps<"hero">) {
  return (
    <section className="relative overflow-hidden bg-brand-900 text-white">
      <div className="qamariya-pattern absolute inset-0" aria-hidden="true" />
      {data.image && <Media media={data.image} locale={locale} className="absolute inset-0 size-full object-cover opacity-25" />}
      <div className="container relative py-14 md:py-20">
        <h2 className="max-w-2xl text-[30px] font-bold md:text-[44px]">{t(data.title, locale)}</h2>
        {data.subtitle && <p className="mt-4 max-w-xl text-lg text-white/80">{t(data.subtitle, locale)}</p>}
        <div className="mt-8 flex flex-wrap gap-3">
          {data.primary && <ButtonLink href={href(locale, data.primary.href)} variant="accent" arrow>{t(data.primary.label, locale)}</ButtonLink>}
          {data.secondary && <ButtonLink href={href(locale, data.secondary.href)} variant="onDark">{t(data.secondary.label, locale)}</ButtonLink>}
        </div>
      </div>
    </section>
  );
}

function TextBlock({ data, locale, anchor, alt }: BlockProps<"text">) {
  return (
    <Section id={anchor} className={clsx("!py-10 md:!py-14", bg(alt))}>
      <div className="max-w-3xl">
        {data.heading && <h2 className="mb-4 text-[24px] font-bold md:text-[30px]">{t(data.heading, locale)}</h2>}
        <RichText html={t(data.body, locale)} />
      </div>
    </Section>
  );
}

function ImageBlock({ data, locale, anchor, alt }: BlockProps<"image">) {
  return (
    <Section id={anchor} className={clsx("!py-10", bg(alt))}>
      <figure className="grid gap-3">
        <Media media={data.image} locale={locale} className="aspect-[16/9] w-full rounded-[20px] border border-line bg-brand-100 object-cover" />
        {data.caption && <figcaption className="text-sm text-muted">{t(data.caption, locale)}</figcaption>}
      </figure>
    </Section>
  );
}

function CardsBlock({ data, locale, dict, anchor, alt }: BlockProps<"cards">) {
  return (
    <Section id={anchor} className={bg(alt)}>
      {data.heading && <h2 className="mb-8 text-[26px] font-bold md:text-[34px]">{t(data.heading, locale)}</h2>}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.items.map((item, i) => {
          const inner = (
            <>
              {item.icon && <IconBadge name={item.icon} />}
              <h3 className="text-lg font-semibold">{t(item.title, locale)}</h3>
              <p className="flex-1 text-[15px] text-muted">{t(item.body, locale)}</p>
              {item.href && <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">{dict.services.more}<Icon name="arrow" className="size-4" directional /></span>}
            </>
          );
          const cls = "flex h-full flex-col gap-4 rounded-card border border-line bg-surface p-6";
          return (
            <li key={i}>
              {item.href
                ? <Link href={href(locale, item.href)} className={clsx(cls, "transition duration-200 ease-bank hover:-translate-y-0.5 hover:border-brand-700/40 hover:shadow-lift")}>{inner}</Link>
                : <div className={cls}>{inner}</div>}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function FeaturesBlock({ data, locale, anchor, alt }: BlockProps<"features">) {
  return (
    <Section id={anchor} className={bg(alt)}>
      <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
        <div>
          {data.heading && <h2 className="text-[26px] font-bold md:text-[34px]">{t(data.heading, locale)}</h2>}
          {data.body && <p className="mt-3 text-muted">{t(data.body, locale)}</p>}
        </div>
        <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
          {data.items.map((f, i) => (
            <li key={i} className="flex gap-4">
              <IconBadge name={f.icon} className="shrink-0" />
              <div><h3 className="text-lg font-semibold">{t(f.title, locale)}</h3><p className="mt-1 text-[15px] text-muted">{t(f.body, locale)}</p></div>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

function StatisticsBlock({ data, locale, anchor, alt }: BlockProps<"statistics">) {
  return (
    <Section id={anchor} className={clsx("!py-12", bg(alt))}>
      {data.heading && <h2 className="mb-6 text-[24px] font-bold md:text-[30px]">{t(data.heading, locale)}</h2>}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-line bg-line md:grid-cols-4">
        {data.items.map((s, i) => (
          <div key={i} className="flex flex-col-reverse gap-1 bg-surface p-5 md:p-6">
            <dt className="text-sm text-muted">{t(s.label, locale)}</dt>
            {/* Years read better without grouping (2009, not 2,009) */}
            <dd className="font-mono text-3xl font-semibold text-brand-900 dark:text-white md:text-4xl">
              {s.value >= 1900 && s.value <= 2100 && !s.suffix ? <span className="tabular" dir="ltr">{s.value}</span> : <Counter value={s.value} suffix={s.suffix} locale={locale} />}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

function FaqBlock({ data, locale, anchor, alt }: BlockProps<"faq">) {
  return (
    <Section id={anchor} className={bg(alt)}>
      <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr]">
        {data.heading && <h2 className="text-[26px] font-bold md:text-[34px]">{t(data.heading, locale)}</h2>}
        <FaqList items={data.items.map((f, i) => ({ id: String(i), question: t(f.question, locale), answer: t(f.answer, locale) }))} />
      </div>
    </Section>
  );
}

function CtaBlock({ data, locale }: BlockProps<"cta">) {
  return (
    <section className="relative overflow-hidden bg-brand-900 py-14 text-white md:py-16">
      <div className="qamariya-pattern absolute inset-0" aria-hidden="true" />
      <div className="container relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div className="max-w-xl">
          <h2 className="text-[26px] font-bold md:text-[36px]">{t(data.title, locale)}</h2>
          {data.body && <p className="mt-3 text-white/75">{t(data.body, locale)}</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={href(locale, data.primary.href)} variant="accent" arrow>{t(data.primary.label, locale)}</ButtonLink>
          {data.secondary && <ButtonLink href={href(locale, data.secondary.href)} variant="onDark">{t(data.secondary.label, locale)}</ButtonLink>}
        </div>
      </div>
    </section>
  );
}

function GalleryBlock({ data, locale, anchor, alt }: BlockProps<"gallery">) {
  return (
    <Section id={anchor} className={bg(alt)}>
      {data.heading && <h2 className="mb-8 text-[26px] font-bold md:text-[34px]">{t(data.heading, locale)}</h2>}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.images.map((m) => (
          <li key={m.id}>
            <figure className="grid gap-2">
              <Media media={m} locale={locale} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="aspect-[4/3] w-full rounded-card border border-line bg-brand-100 object-cover" />
              <figcaption className="text-sm text-muted">{t(m.alt, locale)}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** No third-party iframes (CSP + privacy): direct files play in <video>, everything else is a link-out card. */
function VideoBlock({ data, locale, anchor, alt }: BlockProps<"video">) {
  const direct = /\.(mp4|webm)(\?.*)?$/i.test(data.url);
  const heading = data.heading ? t(data.heading, locale) : "";
  return (
    <Section id={anchor} className={bg(alt)}>
      {heading && <h2 className="mb-6 text-[26px] font-bold md:text-[34px]">{heading}</h2>}
      {direct ? (
        <video controls preload="none" poster={data.poster?.url} className="aspect-video w-full rounded-[20px] bg-brand-900">
          <source src={data.url} />
        </video>
      ) : (
        <a href={data.url} target="_blank" rel="noopener noreferrer" className="group relative grid aspect-video w-full place-items-center overflow-hidden rounded-[20px] bg-brand-900 text-white">
          {data.poster && <Media media={data.poster} locale={locale} className="absolute inset-0 size-full object-cover opacity-60 transition group-hover:opacity-70" />}
          <span className="relative grid size-20 place-items-center rounded-full bg-accent text-brand-900 shadow-lift transition group-hover:scale-105">
            <svg viewBox="0 0 24 24" className="size-8 rtl:-scale-x-100" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          </span>
          <span className="sr-only">{heading || data.url}</span>
          <span className="absolute bottom-4 start-4 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs backdrop-blur" dir="ltr">
            <Icon name="globe" className="size-3.5" />{new URL(data.url).hostname}
          </span>
        </a>
      )}
    </Section>
  );
}

async function MapBlock({ data, locale, dict, anchor, alt }: BlockProps<"map">) {
  const locations = data.type ? await getLocations(data.type) : await getAllLocations();
  const city = data.city ? locations.find((l) => l.city.en === data.city || l.city.ar === data.city) : undefined;
  return (
    <Section id={anchor} className={bg(alt)}>
      {data.heading && <h2 className="mb-8 text-[26px] font-bold md:text-[34px]">{t(data.heading, locale)}</h2>}
      <BranchFinder locations={locations} locale={locale} dict={dict} initialType={data.type ?? ""} initialCity={city ? t(city.city, locale) : ""} />
    </Section>
  );
}

function PeopleBlock({ data, locale, anchor, alt }: BlockProps<"people">) {
  return (
    <Section id={anchor} className={bg(alt)}>
      {data.heading && <h2 className="mb-8 text-[26px] font-bold md:text-[34px]">{t(data.heading, locale)}</h2>}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((p, i) => {
          const photoUrl = p.photo ? (typeof p.photo === "string" ? p.photo : p.photo.url) : null;
          return (
            <li key={i} className="flex gap-4 rounded-card border border-line bg-surface p-5">
              {photoUrl ? (
                <img src={photoUrl} alt={t(p.name, locale)} className="size-16 shrink-0 rounded-full object-cover ring-4 ring-brand-100" />
              ) : (
                <Avatar name={t(p.name, locale)} />
              )}
              <div className="min-w-0">
                <h3 className="font-semibold leading-snug">{t(p.name, locale)}</h3>
                <p className="text-sm font-medium text-brand-700">{t(p.role, locale)}</p>
                {p.bio && <p className="mt-2 text-sm text-muted">{t(p.bio, locale)}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function DocumentsBlock({ data, locale, dict, anchor, alt }: BlockProps<"documents">) {
  return (
    <Section id={anchor} className={clsx("!py-12 md:!py-16", bg(alt))}>
      {data.heading && <h2 className="mb-6 text-[24px] font-bold md:text-[30px]">{t(data.heading, locale)}</h2>}
      <ul className="divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface">
        {data.items.map((d, i) => (
          <li key={i}>
            <a href={d.file.url} download className="group flex items-center gap-4 p-4 transition hover:bg-brand-100/50 md:px-6">
              <span className="grid size-11 shrink-0 place-items-center rounded-card bg-brand-100 text-[11px] font-bold text-brand-700">{dict.common.pdf}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold group-hover:text-brand-700">{t(d.title, locale)}</span>
                {d.year && <span className="tabular font-mono text-sm text-muted">{formatNumber(d.year, locale, { useGrouping: false })}</span>}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                <Icon name="receive" className="size-4" /><span className="hidden sm:inline">{dict.common.download}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}

const blockRegistry: { [K in BlockType]: ComponentType<BlockProps<K>> } = {
  hero: HeroBlock, text: TextBlock, image: ImageBlock, cards: CardsBlock, features: FeaturesBlock,
  statistics: StatisticsBlock, faq: FaqBlock, cta: CtaBlock, gallery: GalleryBlock, video: VideoBlock,
  map: MapBlock, people: PeopleBlock, documents: DocumentsBlock,
};

/** Blocks with their own dark band don't take part in the alternating light backgrounds. */
const FULL_BLEED = new Set<BlockType>(["hero", "cta"]);

export function BlockRenderer({ sections, locale, dict }: { sections: PageSection[]; locale: Locale; dict: Dictionary }) {
  let band = 0;
  return (
    <>
      {sections.map((section) => {
        const Block = blockRegistry[section.type] as ComponentType<BlockProps<BlockType>>;
        if (!Block) return null; // unknown block from a newer CMS version — skip safely
        const alt = !FULL_BLEED.has(section.type) && band++ % 2 === 1;
        const heading = "heading" in section.data ? section.data.heading : null;
        return <Block key={section.id} data={section.data} locale={locale} dict={dict} anchor={anchorOf(heading)} alt={alt} />;
      })}
    </>
  );
}

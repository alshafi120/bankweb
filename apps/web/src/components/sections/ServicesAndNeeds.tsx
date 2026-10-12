import Link from "next/link";
import type { SectionProps } from "./types";
import { href, t } from "@/lib/i18n/config";
import { Section, SectionHeader, IconBadge } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";

export function Services({ content, locale, dict }: SectionProps) {
  return (
    <Section id="services">
      <SectionHeader eyebrow={dict.services.eyebrow} title={dict.services.title} />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-reveal-stagger>
        {content.services.map((s) => (
          <li key={s.id}>
            <Link href={href(locale, s.href)} className="group flex h-full flex-col gap-4 rounded-card border border-line bg-surface p-6 transition duration-200 ease-bank hover:-translate-y-0.5 hover:border-brand-700/40 hover:shadow-lift">
              <IconBadge name={s.icon} className="transition group-hover:bg-brand-900 group-hover:text-accent" />
              <h3 className="text-lg font-semibold">{t(s.title, locale)}</h3>
              <p className="flex-1 text-[15px] text-muted">{t(s.summary, locale)}</p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                {dict.services.more}<Icon name="arrow" className="size-4 transition group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" directional />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function Needs({ content, locale, dict }: SectionProps) {
  return (
    <Section id="needs" className="bg-brand-100/50">
      <SectionHeader eyebrow={dict.needs.eyebrow} title={dict.needs.title} />
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6" data-reveal-stagger>
        {content.needs.map((n) => (
          <li key={n.id}>
            <Link href={href(locale, n.href)} className="group flex h-full min-h-36 flex-col justify-between gap-6 rounded-card bg-surface p-5 transition hover:bg-brand-900 hover:text-white">
              <Icon name={n.icon} className="size-7 text-brand-700 group-hover:text-accent" />
              <span className="flex items-end justify-between gap-2 font-semibold leading-snug">
                {t(n.label, locale)}<Icon name="arrow" className="size-4 shrink-0 opacity-50" directional />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

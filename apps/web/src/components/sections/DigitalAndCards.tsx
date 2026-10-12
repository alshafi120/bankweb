import Link from "next/link";
import type { SectionProps } from "./types";
import { href, t } from "@/lib/i18n/config";
import { ButtonLink, Section, SectionHeader, IconBadge } from "@/components/ui/primitives";
import { PhoneMockup } from "@/components/widgets/PhoneMockup";
import { BankCard } from "@/components/widgets/BankCard";
import { StoreBadges } from "./StoreBadges";

export function Digital({ content, locale, dict }: SectionProps) {
  return (
    <Section id="digital">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHeader eyebrow={dict.digital.eyebrow} title={dict.digital.title} body={dict.digital.body} />
          <ul className="grid gap-3 sm:grid-cols-2">
            {content.digital.map((d) => (
              <li key={d.id} className="flex gap-4 rounded-card border border-line bg-surface p-4">
                <IconBadge name={d.icon} className="size-10 shrink-0 [&>svg]:size-5" />
                <div><h3 className="font-semibold">{t(d.name, locale)}</h3><p className="text-sm text-muted">{t(d.summary, locale)}</p></div>
              </li>
            ))}
          </ul>
          <StoreBadges settings={content.settings} dict={dict} className="mt-8" />
        </div>
        {/* Laptop + phone composition */}
        <div className="relative mx-auto w-full min-w-0 max-w-[560px] pb-10" aria-hidden="true">
          <div className="rounded-t-2xl border-[8px] border-b-0 border-[#0A1F1D] bg-surface">
            <div className="flex h-7 items-center gap-1.5 bg-brand-900 px-3"><span className="size-2 rounded-full bg-white/30" /><span className="size-2 rounded-full bg-white/30" /><span className="size-2 rounded-full bg-white/30" /></div>
            <div className="grid aspect-[16/9] grid-cols-[30%_1fr] gap-3 bg-bg p-3">
              <div className="grid content-start gap-2 rounded-lg bg-brand-900 p-2">{[...Array(5)].map((_, i) => <span key={i} className="h-2 rounded bg-white/20" />)}</div>
              <div className="grid content-start gap-2">
                <div className="grid grid-cols-3 gap-2">{[...Array(3)].map((_, i) => <span key={i} className="h-10 rounded-lg bg-surface shadow-lift" />)}</div>
                <span className="h-20 rounded-lg bg-[linear-gradient(180deg,rgb(var(--brand-700)/.25),transparent)]" />
                {[...Array(3)].map((_, i) => <span key={i} className="h-3 rounded bg-line" />)}
              </div>
            </div>
          </div>
          <div className="h-3 rounded-b-xl bg-[#0A1F1D]" />
          <div className="absolute -bottom-2 end-0 hidden w-[280px] origin-bottom-right scale-[.75] rtl:origin-bottom-left sm:block"><PhoneMockup dict={dict} /></div>
        </div>
      </div>
    </Section>
  );
}

export function Cards({ content, locale, dict }: SectionProps) {
  const bank = t(content.settings.bankName, locale);
  return (
    <Section id="cards" className="bg-brand-100/50">
      <SectionHeader eyebrow={dict.cards.eyebrow} title={dict.cards.title} />
      <ul className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        {content.cards.map((c) => (
          <li key={c.id} className="grid gap-4">
            <BankCard card={c} bankName={bank} label={t(c.name, locale)} />
            <div>
              <h3 className="font-semibold"><Link href={href(locale, `/cards/${c.id}`)} className="hover:text-brand-700 hover:underline">{t(c.name, locale)}</Link></h3>
              <p className="mt-1 text-[15px] text-muted">{t(c.summary, locale)}</p>
            </div>
            <ButtonLink href={href(locale, `/apply/card?type=${c.id}`)} variant="ghost" className="justify-self-start">{dict.cards.request}</ButtonLink>
          </li>
        ))}
      </ul>
    </Section>
  );
}

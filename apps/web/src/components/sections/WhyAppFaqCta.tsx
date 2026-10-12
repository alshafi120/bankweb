import type { SectionProps } from "./types";
import { href, t } from "@/lib/i18n/config";
import { ButtonLink, Section, SectionHeader, IconBadge } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import { Counter } from "@/components/widgets/Counter";
import { PhoneMockup } from "@/components/widgets/PhoneMockup";
import { StoreBadges } from "./StoreBadges";
import { FaqList } from "./FaqList";

export function WhyUs({ content, locale, dict }: SectionProps) {
  return (
    <Section id="why" className="bg-surface">
      <SectionHeader eyebrow={dict.why.eyebrow} title={dict.why.title} />
      <dl className="mb-12 grid grid-cols-2 gap-6 border-y border-line py-8 md:grid-cols-4">
        {content.reasonStats.map((s) => (
          <div key={s.id} className="flex flex-col-reverse">
            <dt className="text-sm text-muted">{t(s.label, locale)}</dt>
            <dd className="font-mono text-3xl font-semibold text-accent md:text-[40px]"><Counter value={s.value} suffix={s.suffix} locale={locale} /></dd>
          </div>
        ))}
      </dl>
      <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {content.reasons.map((r) => (
          <li key={r.id} className="flex gap-4">
            <IconBadge name={r.icon} className="shrink-0" />
            <div><h3 className="text-lg font-semibold">{t(r.title, locale)}</h3><p className="mt-1 text-[15px] text-muted">{t(r.summary, locale)}</p></div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function AppPromo({ content, dict }: SectionProps) {
  const a = dict.app;
  return (
    <Section id="app">
      <div className="grid items-center gap-10 overflow-hidden rounded-[28px] bg-brand-900 p-6 text-white sm:p-10 lg:grid-cols-[1fr_auto_1fr] lg:p-14">
        <div>
          <SectionHeader eyebrow={a.eyebrow} title={a.title} onDark />
          <ul className="grid gap-3">
            {a.features.map((f) => <li key={f} className="flex gap-3"><Icon name="shield" className="mt-1 size-5 shrink-0 text-accent" />{f}</li>)}
          </ul>
          <StoreBadges settings={content.settings} dict={dict} className="mt-8" />
        </div>
        <PhoneMockup dict={dict} className="hidden sm:block" />
        <div className="grid justify-items-center gap-3 text-center lg:justify-self-end">
          <QrCode />
          <p className="max-w-[180px] text-sm text-white/70">{a.scan}</p>
        </div>
      </div>
    </Section>
  );
}

/** Decorative QR placeholder. Production: generate from the real store link at build time. */
function QrCode() {
  const cells = Array.from({ length: 21 * 21 }, (_, i) => {
    const x = i % 21, y = Math.floor(i / 21);
    const finder = (a: number, b: number) => x >= a && x < a + 7 && y >= b && y < b + 7 && (x === a || x === a + 6 || y === b || y === b + 6 || (x >= a + 2 && x <= a + 4 && y >= b + 2 && y <= b + 4));
    if (finder(0, 0) || finder(14, 0) || finder(0, 14)) return true;
    if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) return false;
    return ((x * 7 + y * 13 + x * y) % 5) < 2;
  });
  return (
    <svg viewBox="-2 -2 25 25" className="size-40 rounded-2xl bg-white p-2" role="img" aria-label="QR">
      {cells.map((on, i) => on && <rect key={i} x={i % 21} y={Math.floor(i / 21)} width="1" height="1" fill="#0C3A36" />)}
    </svg>
  );
}

export function Faq({ content, locale, dict }: SectionProps) {
  return (
    <Section id="faq">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <SectionHeader eyebrow={dict.faq.eyebrow} title={dict.faq.title} />
          <ButtonLink href={href(locale, "/faq")} variant="ghost" arrow>{dict.faq.more}</ButtonLink>
        </div>
        <FaqList items={content.faqs.map((f) => ({ id: f.id, question: t(f.question, locale), answer: t(f.answer, locale) }))} />
      </div>
    </Section>
  );
}

export function FinalCta({ locale, dict }: SectionProps) {
  return (
    <section className="relative overflow-hidden bg-brand-900 py-16 text-white md:py-20">
      <div className="qamariya-pattern absolute inset-0" aria-hidden="true" />
      <div className="container relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div className="max-w-xl">
          <h2 className="text-[28px] font-bold md:text-[40px]">{dict.cta.title}</h2>
          <p className="mt-3 text-white/75">{dict.cta.body}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={href(locale, "/apply/account")} variant="accent" arrow>{dict.cta.primary}</ButtonLink>
          <ButtonLink href={href(locale, "/contact")} variant="onDark">{dict.cta.secondary}</ButtonLink>
        </div>
      </div>
    </section>
  );
}

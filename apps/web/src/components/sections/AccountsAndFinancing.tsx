import Link from "next/link";
import type { SectionProps } from "./types";
import { formatMoney, formatNumber, href, t } from "@/lib/i18n/config";
import { ButtonLink, Section, SectionHeader } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import { FinancingCalculator } from "@/components/widgets/FinancingCalculator";

export function Accounts({ content, locale, dict }: SectionProps) {
  const a = dict.accounts;
  return (
    <Section id="accounts">
      <SectionHeader eyebrow={a.eyebrow} title={a.title} />
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {content.accounts.map((acc) => (
          <li key={acc.id} className="flex flex-col rounded-card border border-line bg-surface p-6">
            <p className="text-sm text-brand-700">{t(acc.tagline, locale)}</p>
            <h3 className="mt-1 text-xl font-bold"><Link href={href(locale, acc.href)} className="hover:text-brand-700 hover:underline">{t(acc.name, locale)}</Link></h3>
            <div className="mt-5 grid flex-1 gap-5 text-[15px]">
              <div>
                <p className="mb-2 text-[13px] font-semibold text-muted">{a.features}</p>
                <ul className="grid gap-1.5">{acc.features[locale].map((f) => <li key={f} className="flex gap-2"><Icon name="shield" className="mt-1 size-4 shrink-0 text-success" />{f}</li>)}</ul>
              </div>
              <div>
                <p className="mb-2 text-[13px] font-semibold text-muted">{a.requirements}</p>
                <ul className="grid gap-1 text-muted">{acc.requirements[locale].map((r) => <li key={r}>• {r}</li>)}</ul>
              </div>
            </div>
            <div className="mt-6 border-t border-line pt-4">
              <p className="text-[13px] text-muted">{a.minimum}</p>
              <p className="tabular font-mono font-semibold">{acc.minimumBalance === null ? a.noMinimum : formatMoney(acc.minimumBalance, locale)}</p>
            </div>
            <ButtonLink href={href(locale, `/apply/account?type=${acc.accountType}`)} variant="ghost" className="mt-4 w-full">{a.cta}</ButtonLink>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function Financing({ content, locale, dict }: SectionProps) {
  const f = dict.financing;
  return (
    <Section id="financing" className="bg-surface">
      <SectionHeader eyebrow={f.eyebrow} title={f.title} body={f.body}
        action={<ButtonLink href="#calculator" variant="accent" arrow>{f.calc}</ButtonLink>} />
      <ul className="mb-12 grid gap-px overflow-hidden rounded-[20px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {content.financing.map((p) => (
          <li key={p.id} className="flex flex-col gap-2 bg-surface p-6">
            <h3 className="text-lg font-semibold"><Link href={href(locale, `/financing/${p.id}`)} className="hover:text-brand-700 hover:underline">{t(p.name, locale)}</Link></h3>
            <p className="flex-1 text-[15px] text-muted">{t(p.summary, locale)}</p>
            {/* سقفٌ غيرُ معلنٍ (صفر) يُقال عنه، ولا يُعرض رقماً. */}
            {p.maxAmount > 0 ? (
              <p className="text-sm text-muted">
                {f.upTo} <span className="tabular font-mono font-semibold text-ink">{formatMoney(p.maxAmount, locale)}</span>
                {p.maxMonths > 0 && <>{" · "}<span className="tabular font-mono font-semibold text-ink">{formatNumber(p.maxMonths, locale)}</span> {f.months}</>}
              </p>
            ) : (
              <p className="text-sm text-muted">{locale === "ar" ? "يُحدَّد وفق دراسة البنك" : "Set after the bank\u2019s assessment"}</p>
            )}
          </li>
        ))}
      </ul>
      <FinancingCalculator products={content.financing} locale={locale} dict={dict} />
    </Section>
  );
}

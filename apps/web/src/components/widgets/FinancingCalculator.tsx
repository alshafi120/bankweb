"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import type { FinancingProduct, Locale } from "@/types/content";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { estimateMurabaha } from "@/lib/finance";
import { formatMoney, formatNumber, href, t } from "@/lib/i18n/config";

export function FinancingCalculator({ products, locale, dict, initialProductId }: {
  products: FinancingProduct[]; locale: Locale; dict: Dictionary; initialProductId?: string;
}) {
  const c = dict.calculator;
  const uid = useId();
  /* ═══ قائمةٌ فارغةٌ لا تُسقط الصفحة ═══
     كانت `products[0]!` تَعِد بوجود منتج — فصفحةُ قسمٍ لا تمويلَ فيه
     تنهار عند البناء كلِّه («Cannot read properties of undefined»).
     والصوابُ ألّا تُرسَم الحاسبةُ أصلاً حين لا منتجَ يُحسب. */
  if (!products.length) return null;
  const initial = products.find((p) => p.id === initialProductId) ?? products[0]!;
  const [productId, setProductId] = useState(initial.id);
  const product = products.find((p) => p.id === productId) ?? products[0]!;
  /* سقفٌ غيرُ معلنٍ (صفر) يُعامَل كـ«بلا سقفٍ منشور»: تبقى المدخلاتُ
     على قيمها الافتراضيّة، فالحاسبةُ تقديريّةٌ أصلاً ويقول ذلك تنبيهُها. */
  const cap = initial.maxAmount > 0 ? initial.maxAmount : 2_000_000;
  const capM = initial.maxMonths > 0 ? initial.maxMonths : 24;
  const [amount, setAmount] = useState(Math.min(2_000_000, cap));
  const [months, setMonths] = useState(Math.min(24, capM));
  const [rate, setRate] = useState(product.annualProfitRate);

  const onProduct = (id: string) => {
    const p = products.find((x) => x.id === id)!;
    setProductId(id);
    setRate(p.annualProfitRate);
    setAmount((a) => (p.maxAmount > 0 ? Math.min(a, p.maxAmount) : a));
    setMonths((m) => (p.maxMonths > 0 ? Math.min(m, p.maxMonths) : m));
  };

  const r = useMemo(() => estimateMurabaha({ amount, months, annualRatePct: rate }), [amount, months, rate]);
  const profitShare = r.totalPayable ? r.totalProfit / r.totalPayable : 0;

  const field = "grid gap-2";
  const label = "flex items-baseline justify-between text-sm font-medium";
  const range = "w-full accent-[rgb(var(--brand-700))]";

  return (
    <div id="calculator" className="grid scroll-mt-28 overflow-hidden rounded-[20px] border border-line bg-surface shadow-lift lg:grid-cols-[1.1fr_1fr]">
      <form className="grid gap-6 p-6 md:p-8" onSubmit={(e) => e.preventDefault()} aria-labelledby={`${uid}-t`}>
        <h3 id={`${uid}-t`} className="text-xl font-bold">{c.title}</h3>

        <div className={field}>
          <label htmlFor={`${uid}-type`} className="text-sm font-medium">{c.type}</label>
          <select data-calc="type" id={`${uid}-type`} value={productId} onChange={(e) => onProduct(e.target.value)}
            className="min-h-12 rounded-card border border-line bg-bg px-3">
            {products.map((p) => <option key={p.id} value={p.id} data-max-amount={p.maxAmount} data-max-months={p.maxMonths} data-rate={p.annualProfitRate}>{t(p.name, locale)}</option>)}
          </select>
        </div>

        <div className={field}>
          <label htmlFor={`${uid}-amt`} className={label}>{c.amount}<output data-calc-out="amount" className="tabular font-mono text-brand-700">{formatMoney(amount, locale)}</output></label>
          <input data-calc="amount" id={`${uid}-amt`} type="range" min={100_000} max={product.maxAmount} step={50_000} value={amount}
            onChange={(e) => setAmount(+e.target.value)} className={range} />
        </div>

        <div className={field}>
          <label htmlFor={`${uid}-term`} className={label}>{c.term}<output data-calc-out="months" className="tabular font-mono text-brand-700">{formatNumber(months, locale)} {c.monthsUnit}</output></label>
          <input data-calc="months" id={`${uid}-term`} type="range" min={6} max={product.maxMonths} step={6} value={months}
            onChange={(e) => setMonths(+e.target.value)} className={range} />
        </div>

        <div className={field}>
          <label htmlFor={`${uid}-rate`} className={label}>{c.rate}<output data-calc-out="rate" className="tabular font-mono text-brand-700">{rate}%</output></label>
          <input data-calc="rate" id={`${uid}-rate`} type="range" min={3} max={15} step={0.5} value={rate}
            onChange={(e) => setRate(+e.target.value)} className={range} />
        </div>

        <p className="text-[13px] text-muted">{c.note}</p>
      </form>

      <div className="flex flex-col gap-6 bg-brand-900 p-6 text-white md:p-8" aria-live="polite">
        <div>
          <p className="text-sm text-white/70">{c.monthly}</p>
          <p data-calc-out="monthly" className="tabular font-mono text-4xl font-semibold text-accent md:text-5xl">{formatNumber(r.monthlyInstalment, locale)}</p>
          <p className="text-sm text-white/70">{dict.currency} / {c.monthsUnit}</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/15" role="img" aria-label={`${c.share}: ${Math.round(profitShare * 100)}%`}>
          <div data-calc-out="share" className="h-full bg-accent transition-[width] duration-300" style={{ width: `${profitShare * 100}%` }} />
        </div>
        <dl className="grid gap-3 text-sm">
          {[[c.principal, r.principal], [c.profit, r.totalProfit], [c.total, r.totalPayable]].map(([k, v]) => (
            <div key={k as string} className="flex justify-between border-b border-white/10 pb-3 last:border-0">
              <dt className="text-white/70">{k}</dt>
              <dd data-calc-out={k === c.principal ? "principal" : k === c.profit ? "profit" : "total"} className="tabular font-mono font-semibold">{formatMoney(v as number, locale)}</dd>
            </div>
          ))}
        </dl>
        <Link href={href(locale, `/apply/financing?product=${productId}&amount=${amount}&months=${months}`)}
          className="mt-auto grid min-h-12 place-items-center rounded-full bg-accent font-semibold text-brand-900 hover:brightness-105">
          {c.apply}
        </Link>
      </div>
    </div>
  );
}

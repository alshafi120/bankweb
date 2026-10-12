"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { formatNumber } from "@/lib/i18n/config";

/** Horizontal bars as HTML (wraps long Arabic labels nicely, direction-aware). Single series → one hue. */
export function HBars({ data, label, color = "var(--c1)", max: maxIn }: { data: { label: string; count: number }[]; label: string; color?: string; max?: number }) {
  const { locale } = useI18n();
  const max = maxIn ?? Math.max(...data.map((d) => d.count), 1);
  return (
    <ul aria-label={label} className="space-y-2.5">
      {data.map((d0) => (
        <li key={d0.label} className="group" title={`${d0.label}: ${formatNumber(d0.count, locale)}`}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span className="min-w-0 truncate">{d0.label}</span>
            <span className="num shrink-0 text-xs font-semibold">{formatNumber(d0.count, locale)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-line/50" role="presentation">
            <div className="h-full rounded-full transition-[width] duration-500 ease-bank group-hover:brightness-110" style={{ width: `${(d0.count / max) * 100}%`, background: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

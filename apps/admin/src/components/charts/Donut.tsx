"use client";

import { useState } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { formatCompact, formatNumber } from "@/lib/i18n/config";

/** Donut with 2px surface gaps between slices, center total, and a legend that is also the hover target. */
export function Donut({ data, label, size = 168 }: { data: { key: string; label: string; count: number; color: string }[]; label: string; size?: number }) {
  const { locale, d } = useI18n();
  const [hover, setHover] = useState<string | null>(null);
  const total = data.reduce((s, x) => s + x.count, 0) || 1;
  const r = size / 2 - 6; const inner = r * 0.62; const c = size / 2;
  let a0 = -Math.PI / 2;
  const arcs = data.map((x) => {
    const a = (x.count / total) * Math.PI * 2;
    const s = a0; const e = a0 + a; a0 = e;
    const large = a > Math.PI ? 1 : 0;
    const p = (ang: number, rad: number) => `${(c + rad * Math.cos(ang)).toFixed(2)},${(c + rad * Math.sin(ang)).toFixed(2)}`;
    return { x, path: `M${p(s, r)} A${r},${r} 0 ${large} 1 ${p(e, r)} L${p(e, inner)} A${inner},${inner} 0 ${large} 0 ${p(s, inner)} Z` };
  });
  const active = data.find((x) => x.key === hover);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className="shrink-0">
        {arcs.map(({ x, path }) => (
          <path key={x.key} d={path} fill={x.color} stroke="rgb(var(--surface))" strokeWidth={2} strokeLinejoin="round"
            opacity={hover && hover !== x.key ? 0.35 : 1} onMouseEnter={() => setHover(x.key)} onMouseLeave={() => setHover(null)} className="transition-opacity" />
        ))}
        <text x={c} y={c - 4} textAnchor="middle" className="num fill-ink text-[20px] font-semibold">{active ? `${Math.round((active.count / total) * 100)}%` : formatCompact(total, locale)}</text>
        <text x={c} y={c + 14} textAnchor="middle" className="fill-muted text-[11px]">{active ? active.label : d.common.total}</text>
      </svg>
      <ul className="w-full min-w-0 flex-1 space-y-1.5 text-sm">
        {data.map((x) => (
          <li key={x.key}>
            <button type="button" onMouseEnter={() => setHover(x.key)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(x.key)} onBlur={() => setHover(null)}
              className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-start hover:bg-line/30">
              <span className="size-2.5 shrink-0 rounded-sm" style={{ background: x.color }} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{x.label}</span>
              <span className="num text-xs text-muted">{Math.round((x.count / total) * 100)}%</span>
              <span className="num w-14 text-end text-xs font-semibold">{formatNumber(x.count, locale)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useWidth, niceMax, ticks } from "./useSize";
import { ChartTooltip, TipRow } from "./Tooltip";
import { useI18n } from "@/components/providers/I18nProvider";
import { formatNumber } from "@/lib/i18n/config";

/** Vertical stacked bars (date × series). 2px surface gap between segments, rounded top only. */
export function StackedBars<K extends string>({ data, series, label, height = 240 }: {
  data: ({ date: string } & Record<K, number>)[]; series: { key: K; label: string; color: string }[]; label: string; height?: number;
}) {
  const { locale } = useI18n();
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { top: 10, right: 8, bottom: 26, left: 32 };
  const w = Math.max(0, width - pad.left - pad.right);
  const h = height - pad.top - pad.bottom;
  const totals = data.map((r) => series.reduce((s, se) => s + (r[se.key] ?? 0), 0));
  const max = niceMax(Math.max(...totals, 1));
  const band = w / Math.max(1, data.length);
  const bw = Math.max(4, Math.min(28, band * 0.62));
  const y = (v: number) => (v / max) * h;
  const fmtDate = (s: string) => new Intl.DateTimeFormat(locale === "ar" ? "ar-YE-u-nu-latn" : "en-GB", { day: "numeric", month: "short" }).format(new Date(s));
  const every = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(w / (locale === "ar" ? 85 : 65)))));

  return (
    <div ref={ref} className="relative w-full" style={{ height }} dir="ltr">
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={label} className="block" onMouseLeave={() => setHover(null)}>
          {ticks(max, 4).map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={pad.left + w} y1={pad.top + h - y(t)} y2={pad.top + h - y(t)} stroke="rgb(var(--border))" strokeDasharray={t === 0 ? undefined : "2 4"} />
              <text x={pad.left - 6} y={pad.top + h - y(t)} dy="0.32em" textAnchor="end" className="num fill-muted text-[10.5px]">{formatNumber(t, locale)}</text>
            </g>
          ))}
          {data.map((r, i) => {
            const cx = pad.left + band * i + band / 2;
            let acc = 0;
            const segs = series.map((se) => {
              const v = r[se.key] ?? 0; const y0 = acc; acc += v;
              return { se, v, y0 };
            }).filter((s) => s.v > 0);
            return (
              <g key={r.date} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} role="img"
                aria-label={`${fmtDate(r.date)}: ${series.map((se) => `${se.label} ${r[se.key] ?? 0}`).join("، ")}`} className="focus:outline-none">
                <rect x={pad.left + band * i} y={pad.top} width={band} height={h} fill={hover === i ? "rgb(var(--border) / .35)" : "transparent"} />
                {segs.map((s, si) => {
                  const top = si === segs.length - 1;
                  const segH = Math.max(0, y(s.v) - (top ? 0 : 2));
                  const yy = pad.top + h - y(s.y0) - y(s.v);
                  const r0 = top ? Math.min(4, bw / 2, segH) : 0;
                  return <path key={s.se.key} fill={s.se.color}
                    d={`M${cx - bw / 2},${yy + segH} V${yy + r0} Q${cx - bw / 2},${yy} ${cx - bw / 2 + r0},${yy} H${cx + bw / 2 - r0} Q${cx + bw / 2},${yy} ${cx + bw / 2},${yy + r0} V${yy + segH} Z`} />;
                })}
                {((i % every === 0 && data.length - 1 - i >= every * 0.75) || i === data.length - 1) && <text x={cx} y={height - 8} textAnchor="middle" className="num fill-muted text-[10.5px]">{fmtDate(r.date)}</text>}
              </g>
            );
          })}
        </svg>
      )}
      {hover != null && data[hover] && (
        <ChartTooltip x={pad.left + band * hover + band / 2} y={pad.top + h - y(totals[hover]!)} width={width}>
          <p className="mb-1 font-semibold">{fmtDate(data[hover].date)}</p>
          {series.map((se) => <TipRow key={se.key} color={se.color} label={se.label} value={formatNumber(data[hover]![se.key] ?? 0, locale)} />)}
          <div className="mt-1 border-t border-line pt-1"><TipRow label="Σ" value={formatNumber(totals[hover]!, locale)} /></div>
        </ChartTooltip>
      )}
    </div>
  );
}

"use client";

import { useState, type KeyboardEvent } from "react";
import { useWidth, niceMax, ticks } from "./useSize";
import { ChartTooltip, TipRow } from "./Tooltip";
import { useI18n } from "@/components/providers/I18nProvider";
import { formatCompact, formatNumber } from "@/lib/i18n/config";

/** Single-series area/line over time with crosshair + tooltip, keyboard navigable. (RTL: time still flows left→right like the axis labels.) */
export function AreaChart({ data, label, height = 240, color = "var(--c1)" }: { data: { date: string; count: number }[]; label: string; height?: number; color?: string }) {
  const { locale } = useI18n();
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { top: 12, right: 16, bottom: 26, left: locale === "ar" ? 58 : 44 };
  const w = Math.max(0, width - pad.left - pad.right);
  const h = height - pad.top - pad.bottom;
  const max = niceMax(Math.max(...data.map((p) => p.count), 1) * 1.05);
  const x = (i: number) => pad.left + (data.length <= 1 ? w / 2 : (i / (data.length - 1)) * w);
  const y = (v: number) => pad.top + h - (v / max) * h;
  const line = data.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.count).toFixed(1)}`).join("");
  const area = `${line}L${x(data.length - 1)},${pad.top + h}L${x(0)},${pad.top + h}Z`;
  const fmtDate = (s: string) => new Intl.DateTimeFormat(locale === "ar" ? "ar-YE-u-nu-latn" : "en-GB", { day: "numeric", month: "short" }).format(new Date(s));
  const every = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(w / (locale === "ar" ? 95 : 75)))));

  const onMove = (clientX: number, rect: DOMRect) => {
    const rel = clientX - rect.left - pad.left;
    const i = Math.round((rel / w) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); setHover((h0) => Math.min(data.length - 1, (h0 ?? -1) + 1)); }
    if (e.key === "ArrowLeft") { e.preventDefault(); setHover((h0) => Math.max(0, (h0 ?? data.length) - 1)); }
    if (e.key === "Escape") setHover(null);
  };
  const pt = hover != null ? data[hover] : null;

  return (
    <div ref={ref} className="relative w-full" style={{ height }} dir="ltr">
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={label} tabIndex={0} onKeyDown={onKey} onBlur={() => setHover(null)}
          onMouseMove={(e) => onMove(e.clientX, e.currentTarget.getBoundingClientRect())} onMouseLeave={() => setHover(null)}
          onTouchMove={(e) => onMove(e.touches[0]!.clientX, e.currentTarget.getBoundingClientRect())} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded-md">
          <defs>
            <linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity=".22" /><stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks(max).map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={pad.left + w} y1={y(t)} y2={y(t)} stroke="rgb(var(--border))" strokeDasharray={t === 0 ? undefined : "2 4"} />
              <text x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="num fill-muted text-[10.5px]">{formatCompact(t, locale)}</text>
            </g>
          ))}
          {data.map((p, i) => (i % every === 0 && data.length - 1 - i >= every * 0.75) || i === data.length - 1 ? (
            <text key={p.date} x={x(i)} y={height - 8} textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"} className="num fill-muted text-[10.5px]">{fmtDate(p.date)}</text>
          ) : null)}
          <path d={area} fill="url(#area-fill)" />
          <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {pt && (
            <g>
              <line x1={x(hover!)} x2={x(hover!)} y1={pad.top} y2={pad.top + h} stroke="rgb(var(--muted))" strokeOpacity=".5" />
              <circle cx={x(hover!)} cy={y(pt.count)} r={4.5} fill={color} stroke="rgb(var(--surface))" strokeWidth={2} />
            </g>
          )}
        </svg>
      )}
      {pt && <ChartTooltip x={x(hover!)} y={y(pt.count)} width={width}>
        <p className="mb-1 font-semibold">{fmtDate(pt.date)}</p>
        <TipRow color={color} label={label} value={formatNumber(pt.count, locale)} />
      </ChartTooltip>}
    </div>
  );
}

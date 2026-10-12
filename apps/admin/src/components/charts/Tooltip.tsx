"use client";

import type { ReactNode } from "react";

/** Positioned inside the chart wrapper (relative). Flips to stay inside the box. */
export function ChartTooltip({ x, y, width, children }: { x: number; y: number; width: number; children: ReactNode }) {
  const flip = x > width - 170;
  return (
    <div role="status" aria-live="polite" className="pointer-events-none absolute z-10 min-w-[140px] rounded-lg border border-line bg-surface px-2.5 py-2 text-xs shadow-pop"
      style={{ left: flip ? undefined : x + 12, right: flip ? width - x + 12 : undefined, top: Math.max(0, y - 10), direction: "inherit" }}>
      {children}
    </div>
  );
}

export function TipRow({ color, label, value }: { color?: string; label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      {color && <span className="size-2.5 shrink-0 rounded-sm" style={{ background: color }} aria-hidden="true" />}
      <span className="flex-1 text-muted">{label}</span>
      <span className="num font-semibold text-ink">{value}</span>
    </div>
  );
}

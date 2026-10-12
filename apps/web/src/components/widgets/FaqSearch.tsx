"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Progressive enhancement over the server-rendered FAQ: filters the existing <details> in place
 * (no duplicated data shipped to the client). Matching items open; empty groups hide.
 */
export function FaqSearch({ targetId, label, placeholder, none, countLabel }: { targetId: string; label: string; placeholder: string; none: string; countLabel: string }) {
  const uid = useId();
  const [q, setQ] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const first = useRef(true);

  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;
    const query = q.trim().toLowerCase();
    let shown = 0;
    root.querySelectorAll<HTMLElement>("[data-faq-group]").forEach((group) => {
      let groupShown = 0;
      group.querySelectorAll<HTMLDetailsElement>("details[data-faq]").forEach((d) => {
        const hit = !query || (d.dataset.faq ?? "").includes(query);
        d.hidden = !hit;
        if (query && hit) d.open = true;
        if (hit) groupShown++;
      });
      group.hidden = groupShown === 0;
      shown += groupShown;
    });
    if (first.current) { first.current = false; return; }
    setCount(shown);
  }, [q, targetId]);

  return (
    <div className="grid gap-2">
      <label htmlFor={uid} className="text-sm font-medium">{label}</label>
      <div className="relative">
        <Icon name="eye" className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
        <input id={uid} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} autoComplete="off"
          className="min-h-12 w-full rounded-card border border-line bg-surface pe-3 ps-11" aria-describedby={`${uid}-s`} />
      </div>
      <p id={`${uid}-s`} role="status" className="min-h-6 text-sm text-muted">
        {count === null ? "" : count === 0 ? none : <><span className="tabular font-semibold text-ink">{count}</span> {countLabel}</>}
      </p>
    </div>
  );
}

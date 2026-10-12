"use client";

import type { PageMeta } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/components/providers/I18nProvider";
import { formatNumber } from "@/lib/i18n/config";

export function Pagination({ meta, onPage, perPage, onPerPage }: { meta: PageMeta; onPage: (p: number) => void; perPage: number; onPerPage: (n: number) => void }) {
  const { d, f, locale } = useI18n();
  const from = meta.total === 0 ? 0 : (meta.currentPage - 1) * meta.perPage + 1;
  const to = Math.min(meta.total, meta.currentPage * meta.perPage);
  const pages: (number | "…")[] = [];
  for (let p = 1; p <= meta.lastPage; p++) {
    if (p === 1 || p === meta.lastPage || Math.abs(p - meta.currentPage) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-3 py-2.5 text-sm">
      <div className="flex items-center gap-3 text-muted">
        <span className="num">{f(d.list.showing, { from: formatNumber(from, locale), to: formatNumber(to, locale), total: formatNumber(meta.total, locale) })}</span>
        <label className="hidden items-center gap-1.5 sm:flex">
          <span>{d.common.perPage}</span>
          <select className="field num h-8 min-h-8 w-auto py-0 pe-7" value={perPage} onChange={(e) => onPerPage(Number(e.target.value))}>
            {[10, 15, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
      <nav aria-label={d.common.page} className="flex items-center gap-1">
        <Button size="iconSm" icon="chevronSide" directional className="[&_svg]:rotate-180" disabled={meta.currentPage <= 1} onClick={() => onPage(meta.currentPage - 1)} aria-label={d.list.prev} />
        {pages.map((p, i) => p === "…" ? <span key={`e${i}`} className="px-1 text-muted">…</span> : (
          <button key={p} type="button" onClick={() => onPage(p)} aria-current={p === meta.currentPage ? "page" : undefined}
            className={`num hidden size-8 rounded-lg text-sm font-semibold xs:inline-block ${p === meta.currentPage ? "bg-brand-900 text-white dark:bg-brand-700 dark:text-bg" : "hover:bg-line/40"}`}>{p}</button>
        ))}
        <Button size="iconSm" icon="chevronSide" directional disabled={meta.currentPage >= meta.lastPage} onClick={() => onPage(meta.currentPage + 1)} aria-label={d.list.next} />
      </nav>
    </div>
  );
}

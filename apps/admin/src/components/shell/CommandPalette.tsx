"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NAV } from "@/lib/nav";
import { RESOURCES } from "@/resources";
import { resourceApi } from "@/lib/api/endpoints";
import { tl } from "@/lib/i18n/config";
import { Icon, type AnyIcon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Button";
import { useI18n } from "@/components/providers/I18nProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import type { AnyRecord } from "@/types/admin";

interface Entry { id: string; group: string; label: string; sub?: string; icon: AnyIcon; href: string }

/** Ctrl/⌘+K: jump to screens, create items, and search content across resources the user can view. */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { d, locale, f } = useI18n();
  const { can } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [results, setResults] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const nav = d.nav as Record<string, string>;
  const res = d.resources as Record<string, { one: string; many: string }>;

  useEffect(() => { if (open) { setQ(""); setActive(0); setResults([]); requestAnimationFrame(() => input.current?.focus()); } }, [open]);

  const staticEntries = useMemo<Entry[]>(() => {
    const screens = NAV.filter((n) => can(n.permission)).map((n) => ({ id: `s-${n.key}`, group: d.palette.screens, label: nav[n.key] ?? n.key, icon: n.icon, href: `/${locale}${n.path}` }));
    screens.push({ id: "s-profile", group: d.palette.screens, label: d.nav.profile, icon: "user", href: `/${locale}/profile` });
    const creates = RESOURCES.filter((r) => !r.noCreate && can(`${r.permission}.create`)).map((r) => ({
      id: `c-${r.key}`, group: d.palette.create, label: f(d.palette.newItem, { item: res[r.key]?.one ?? r.key }), icon: "plus" as AnyIcon, href: `/${locale}/${r.key}/new`,
    }));
    return [...screens, ...creates];
  }, [can, d, f, locale, nav, res]);

  // Debounced content search across a few searchable resources.
  useEffect(() => {
    if (!open || q.trim().length < 2) { setResults([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      const targets = RESOURCES.filter((r) => r.searchable && can(`${r.permission}.view`)).slice(0, 10);
      const settled = await Promise.allSettled(targets.map((r) => resourceApi.list<AnyRecord>(r.endpoint, { search: q.trim(), perPage: 3 }).then((p) => ({ r, rows: p.data }))));
      if (ctrl.signal.aborted) return;
      const out: Entry[] = [];
      settled.forEach((s) => {
        if (s.status !== "fulfilled") return;
        s.value.rows.forEach((row) => {
          const v = row[s.value.r.labelKey];
          const label = typeof v === "string" ? v : tl(v as { ar: string; en: string }, locale);
          out.push({ id: `r-${s.value.r.key}-${row.id}`, group: d.palette.results, label: label || `#${row.id}`, sub: res[s.value.r.key]?.many, icon: s.value.r.icon, href: `/${locale}/${s.value.r.key}/${row.id}` });
        });
      });
      setResults(out);
      setLoading(false);
    }, 220);
    return () => { ctrl.abort(); clearTimeout(t); };
  }, [q, open, can, locale, d.palette.results, res]);

  const needle = q.trim().toLowerCase();
  const filtered = [...staticEntries.filter((e) => !needle || e.label.toLowerCase().includes(needle)), ...results].slice(0, 40);

  useEffect(() => { setActive(0); }, [q]);

  if (!open || typeof document === "undefined") return null;

  const go = (e: Entry | undefined) => { if (!e) return; onClose(); router.push(e.href); };
  const groups = [...new Set(filtered.map((e) => e.group))];

  return createPortal(
    <div className="fixed inset-0 z-[75] flex items-start justify-center p-3 pt-[10vh]" role="dialog" aria-modal="true" aria-label={d.palette.title}>
      <div className="fade-in absolute inset-0 bg-brand-900/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div className="pop-in relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
        <div className="flex items-center gap-2 border-b border-line px-4">
          <Icon name="search" className="size-5 text-muted" />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder={d.palette.placeholder}
            role="combobox" aria-expanded="true" aria-controls="cmd-list" aria-activedescendant={filtered[active]?.id} aria-autocomplete="list"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(filtered.length - 1, a + 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
              else if (e.key === "Enter") { e.preventDefault(); go(filtered[active]); }
              else if (e.key === "Escape") onClose();
            }}
            className="h-12 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted" />
          {loading && <Spinner className="size-4 text-muted" />}
          <kbd className="hidden rounded border border-line px-1.5 text-2xs text-muted sm:inline">Esc</kbd>
        </div>
        <ul id="cmd-list" role="listbox" aria-label={d.palette.title} className="scrollbar-thin max-h-[55vh] overflow-y-auto p-2">
          {filtered.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted">{loading ? d.palette.searching : d.common.noResults}</li>}
          {groups.map((g) => (
            <li key={g} role="presentation">
              <p className="px-2 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wide text-muted">{g}</p>
              <ul role="group" aria-label={g}>
                {filtered.map((e, i) => e.group !== g ? null : (
                  <li key={e.id} id={e.id} role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onClick={() => go(e)}
                    className={clsx("flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm", i === active ? "bg-brand-100 text-brand-700" : "text-ink")}>
                    <Icon name={e.icon} className="size-4" />
                    <span className="min-w-0 flex-1 truncate">{e.label}</span>
                    {e.sub && <span className="text-xs text-muted">{e.sub}</span>}
                    {i === active && <Icon name="arrow" className="size-4" directional />}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <p className="border-t border-line bg-raised px-4 py-2 text-2xs text-muted">{d.palette.hint}</p>
      </div>
    </div>,
    document.body,
  );
}

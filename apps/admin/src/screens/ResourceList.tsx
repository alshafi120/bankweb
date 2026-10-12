"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { BulkInput } from "@/types/api";
import type { AnyRecord } from "@/types/admin";
import type { ColumnDef, ResourceDef } from "@/resources/types";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Controls";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { Menu } from "@/components/ui/Menu";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, ErrorState, Forbidden, PageHeader, Skeleton } from "@/components/ui/States";
import { Cell, cellText, useRelationLabels } from "@/components/data-table/Cells";
import { Pagination } from "@/components/data-table/Pagination";
import { useI18n } from "@/components/providers/I18nProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { resourceApi } from "@/lib/api/endpoints";
import { useAsync, useDebounced, invalidateRelation } from "@/lib/hooks/useAsync";
import { formatNumber, tl } from "@/lib/i18n/config";
import { downloadText, toCsv } from "@/lib/csv";

const hideCls = { md: "hidden md:table-cell", lg: "hidden lg:table-cell", xl: "hidden xl:table-cell" } as const;

/** Generic list screen: search, status chips, filters, sortable columns, pagination, selection + bulk actions, CSV, skeletons, empty state; cards on phones. */
export function ResourceList({ def }: { def: ResourceDef }) {
  const { d, f, locale } = useI18n();
  const { can } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // URL is the source of truth for list state (shareable, back-button friendly).
  const page = Number(sp.get("page") ?? 1);
  const perPage = Number(sp.get("perPage") ?? 15);
  const status = sp.get("status") ?? "";
  const sort = sp.get("sort") ?? def.defaultSort;
  const filters = Object.fromEntries((def.filters ?? []).map((fl) => [fl.key, sp.get(fl.key) ?? ""]));
  const [search, setSearch] = useState(sp.get("q") ?? "");
  const q = useDebounced(search, 300);

  const setParams = (patch: Record<string, string | number | null>, resetPage = true) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) { if (v === null || v === "") next.delete(k); else next.set(k, String(v)); }
    if (resetPage && !("page" in patch)) next.delete("page");
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };
  useEffect(() => { if ((sp.get("q") ?? "") !== q) setParams({ q: q || null }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [q]);

  const query = { page, perPage, search: q, status, sort, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v).map(([k, v]) => [`filter[${k}]`, v])) };
  const { data, error, loading, reload } = useAsync(() => resourceApi.list<AnyRecord>(def.endpoint, query), [def.endpoint, JSON.stringify(query)]);
  const relations = useRelationLabels([...def.columns, ...(def.filters ?? []).filter((fl) => fl.relation).map((fl) => ({ key: fl.key, kind: "relation" as const, relation: fl.relation, label: fl.label }))]);

  const [selected, setSelected] = useState<number[]>([]);
  const [bulk, setBulk] = useState<BulkInput["action"] | null>(null);
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<AnyRecord | null>(null);
  useEffect(() => { setSelected([]); }, [data]);

  const res = (d.resources as Record<string, { one: string; many: string }>)[def.key];
  const title = res?.many ?? tl(def.title.many, locale);
  const one = res?.one ?? tl(def.title.one, locale);
  if (!can(`${def.permission}.view`)) return <Forbidden />;

  const rows = data?.data ?? [];
  const canCreate = !def.noCreate && can(`${def.permission}.create`);
  const allowedBulk = (def.bulkActions ?? []).filter((a) => can(`${def.permission}.${a === "delete" ? "delete" : a === "publish" || a === "unpublish" ? "publish" : "update"}`));
  const canSelect = allowedBulk.length > 0;
  const allOnPage = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  const labelOf = (r: AnyRecord) => { const v = r[def.labelKey]; return typeof v === "string" ? v : tl(v as { ar: string; en: string }, locale) || `#${r.id}`; };
  const hasFilters = !!(q || status || Object.values(filters).some(Boolean));

  const runBulk = async () => {
    if (!bulk) return;
    setBusy(true);
    try {
      const r = await resourceApi.bulk(def.endpoint, { action: bulk, ids: selected });
      toast({ tone: "success", title: f(d.list.bulkDone, { count: r.affected }) });
      invalidateRelation(def.endpoint); setBulk(null); void reload();
    } catch { toast({ tone: "error", title: d.errors.generic }); } finally { setBusy(false); }
  };
  const runDelete = async () => {
    if (!del) return;
    setBusy(true);
    try { await resourceApi.remove(def.endpoint, del.id); toast({ tone: "success", title: d.list.deleted }); invalidateRelation(def.endpoint); setDel(null); void reload(); }
    catch { toast({ tone: "error", title: d.errors.generic }); } finally { setBusy(false); }
  };
  const exportCsv = async () => {
    try {
      const all = await resourceApi.list<AnyRecord>(def.endpoint, { ...query, page: 1, perPage: 100 });
      const cols = def.columns.filter((c) => c.kind !== "media" && c.kind !== "icon");
      const csv = toCsv([["id", ...cols.map((c) => tl(c.label, locale))], ...all.data.map((r) => [r.id, ...cols.map((c) => cellText(c, r, locale, relations))])]);
      downloadText(csv, `${def.key}-${new Date().toISOString().slice(0, 10)}.csv`);
      toast({ tone: "success", title: f(d.list.exported, { count: all.data.length }) });
    } catch { toast({ tone: "error", title: d.errors.generic }); }
  };

  const sortHeader = (c: ColumnDef) => {
    const active = sort.replace(/^-/, "") === c.key;
    const desc = sort.startsWith("-");
    const colLabel = tl(c.label, locale);
    return (
      <button type="button" onClick={() => setParams({ sort: active && !desc ? `-${c.key}` : c.key })} aria-label={f(d.list.sortBy, { col: colLabel })}
        className={clsx("inline-flex items-center gap-1 font-semibold hover:text-ink", active ? "text-ink" : "")}>
        {colLabel}<Icon name={active ? (desc ? "sortDown" : "sortUp") : "sort"} className={clsx("size-3.5", !active && "opacity-40")} />
      </button>
    );
  };
  const editHref = (r: AnyRecord) => `/${locale}/${def.key}/${r.id}`;

  return (
    <div>
      <PageHeader title={title} subtitle={data ? `${d.common.total}: ${formatNumber(data.meta.total, locale)}` : undefined}
        actions={<>
          {def.csv && can(`${def.permission}.view`) && <Button icon="download" onClick={exportCsv}>{d.common.exportCsv}</Button>}
          {canCreate && <ButtonLink href={`/${locale}/${def.key}/new`} variant="primary" icon="plus">{f(d.form.newTitle, { item: one })}</ButtonLink>}
        </>} />

      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          {def.searchable !== false && (
            <div className="relative min-w-0 flex-1 basis-60">
              <Icon name="search" className="pointer-events-none absolute inset-y-0 start-2.5 my-auto size-4 text-muted" />
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={d.common.searchPlaceholder} aria-label={`${d.common.search} — ${title}`} className="field ps-8" />
            </div>
          )}
          {(def.filters ?? []).map((fl) => (
            <select key={fl.key} aria-label={tl(fl.label, locale)} className="field w-auto max-w-[12rem]" value={filters[fl.key] ?? ""} onChange={(e) => setParams({ [fl.key]: e.target.value || null })}>
              <option value="">{tl(fl.label, locale)}: {d.common.all}</option>
              {(fl.options ?? Object.entries(relations[fl.key] ?? {}).map(([value, label]) => ({ value, label }))).map((o) => <option key={o.value} value={o.value}>{tl(o.label, locale)}</option>)}
            </select>
          ))}
          {hasFilters && <Button variant="ghost" size="sm" icon="close" onClick={() => { setSearch(""); router.replace(pathname); }}>{d.common.clearFilters}</Button>}
        </div>
        {def.statuses && (
          <div className="scrollbar-thin flex gap-1.5 overflow-x-auto border-b border-line px-3 py-2" role="group" aria-label={d.common.status}>
            {["", ...def.statuses].map((s) => (
              <button key={s || "all"} type="button" aria-pressed={status === s} onClick={() => setParams({ status: s || null })}
                className={clsx("h-7 shrink-0 rounded-full border px-3 text-xs font-semibold transition-colors",
                  status === s ? "border-brand-700 bg-brand-100 text-brand-700" : "border-line text-muted hover:text-ink")}>
                {s ? (d.status as Record<string, string>)[s] ?? s : d.common.all}
              </button>
            ))}
          </div>
        )}

        {/* Bulk bar */}
        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-brand-100/60 px-3 py-2" role="region" aria-label={d.common.actions}>
            <span className="text-sm font-semibold">{f(d.list.selectedCount, { count: selected.length })}</span>
            <span className="flex flex-wrap gap-1.5">
              {allowedBulk.map((a) => <Button key={a} size="sm" variant={a === "delete" ? "danger" : "secondary"} onClick={() => setBulk(a)}>{(d.bulk as Record<string, string>)[a]}</Button>)}
            </span>
            <Button size="sm" variant="ghost" className="ms-auto" onClick={() => setSelected([])}>{d.common.deselectAll}</Button>
          </div>
        )}

        {error ? <div className="p-4"><ErrorState error={error} onRetry={reload} /></div>
          : loading && !data ? <TableSkeleton cols={def.columns.length} />
          : rows.length === 0 ? (
            <EmptyState icon={hasFilters ? "search" : def.icon} title={hasFilters ? d.list.emptyFiltered : d.list.empty} body={hasFilters ? undefined : d.list.emptyBody}
              action={hasFilters ? <Button onClick={() => { setSearch(""); router.replace(pathname); }}>{d.common.clearFilters}</Button>
                : canCreate ? <ButtonLink href={`/${locale}/${def.key}/new`} variant="primary" icon="plus">{f(d.form.newTitle, { item: one })}</ButtonLink> : undefined} />
          ) : (
            <>
              {/* ≥ 640px: table */}
              <div className={clsx("hidden overflow-x-auto sm:block", loading && "opacity-60 transition-opacity")}>
                <table className="w-full text-sm">
                  <caption className="sr-only">{title}</caption>
                  <thead className="bg-raised text-xs text-muted">
                    <tr>
                      {canSelect && <th scope="col" className="w-10 px-3 py-2"><Checkbox checked={allOnPage} indeterminate={!allOnPage && rows.some((r) => selected.includes(r.id))}
                        onChange={(on) => setSelected(on ? [...new Set([...selected, ...rows.map((r) => r.id)])] : selected.filter((id) => !rows.some((r) => r.id === id)))} ariaLabel={d.common.selectAll} /></th>}
                      {def.columns.map((c) => (
                        <th key={c.key} scope="col" aria-sort={sort.replace(/^-/, "") === c.key ? (sort.startsWith("-") ? "descending" : "ascending") : undefined}
                          className={clsx("whitespace-nowrap px-3 py-2 font-semibold", c.align === "end" ? "text-end" : "text-start", c.hideBelow && hideCls[c.hideBelow])}>
                          {c.sortable ? sortHeader(c) : tl(c.label, locale)}
                        </th>
                      ))}
                      <th scope="col" className="w-12 px-3 py-2"><span className="sr-only">{d.common.actions}</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className={clsx("border-t border-line transition-colors hover:bg-raised", selected.includes(r.id) && "bg-brand-100/40")}>
                        {canSelect && <td className="px-3 py-2"><Checkbox checked={selected.includes(r.id)} ariaLabel={`${d.list.selectRow}: ${labelOf(r)}`}
                          onChange={(on) => setSelected(on ? [...selected, r.id] : selected.filter((x) => x !== r.id))} /></td>}
                        {def.columns.map((c, ci) => (
                          <td key={c.key} className={clsx("max-w-[22rem] px-3 py-2 align-middle", c.align === "end" && "text-end", c.hideBelow && hideCls[c.hideBelow])}>
                            {c.kind === "title" || (ci === 0 && c.kind !== "media" && c.kind !== "icon")
                              ? <Link href={editHref(r)} className="block min-w-0 rounded hover:text-brand-700"><Cell col={c} row={r} relations={relations} /></Link>
                              : <Cell col={c} row={r} relations={relations} />}
                          </td>
                        ))}
                        <td className="px-2 py-2 text-end"><RowMenu def={def} row={r} onDelete={() => setDel(r)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* < 640px: stacked cards */}
              <ul className="divide-y divide-line sm:hidden">
                {rows.map((r) => {
                  const titleCol = def.columns.find((c) => c.kind === "title") ?? def.columns[0]!;
                  const media = def.columns.find((c) => c.kind === "media" || c.kind === "icon");
                  const rest = def.columns.filter((c) => c !== titleCol && c !== media);
                  return (
                    <li key={r.id} className={clsx("flex gap-3 p-3", selected.includes(r.id) && "bg-brand-100/40")}>
                      {canSelect && <Checkbox className="mt-0.5 self-start" checked={selected.includes(r.id)} ariaLabel={`${d.list.selectRow}: ${labelOf(r)}`} onChange={(on) => setSelected(on ? [...selected, r.id] : selected.filter((x) => x !== r.id))} />}
                      {media && <Cell col={media} row={r} relations={relations} />}
                      <div className="min-w-0 flex-1">
                        <Link href={editHref(r)} className="block"><Cell col={titleCol} row={r} relations={relations} /></Link>
                        <dl className="mt-1.5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
                          {rest.slice(0, 4).map((c) => <div key={c.key} className="contents"><dt className="text-muted">{tl(c.label, locale)}</dt><dd className="min-w-0 truncate"><Cell col={c} row={r} relations={relations} /></dd></div>)}
                        </dl>
                      </div>
                      <RowMenu def={def} row={r} onDelete={() => setDel(r)} />
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        {data && data.meta.total > 0 && <Pagination meta={data.meta} perPage={perPage} onPage={(p) => setParams({ page: p }, false)} onPerPage={(n) => setParams({ perPage: n })} />}
      </div>

      <ConfirmDialog open={!!bulk} onClose={() => setBulk(null)} onConfirm={runBulk} loading={busy} tone={bulk === "delete" ? "danger" : "primary"}
        title={d.list.bulkConfirmTitle} body={f(d.list.bulkConfirm, { action: bulk ? (d.bulk as Record<string, string>)[bulk] ?? bulk : "", count: selected.length })} />
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={runDelete} loading={busy} title={d.list.deleteConfirmTitle}
        body={del ? f(d.list.deleteConfirm, { name: labelOf(del) }) : ""} confirmLabel={d.common.delete} />
    </div>
  );
}

function RowMenu({ def, row, onDelete }: { def: ResourceDef; row: AnyRecord; onDelete: () => void }) {
  const { d, locale } = useI18n();
  const { can } = useAuth();
  const router = useRouter();
  const items = [
    { id: "edit", label: can(`${def.permission}.update`) ? d.common.edit : d.common.view, icon: (can(`${def.permission}.update`) ? "edit" : "eye") as "edit" | "eye", onSelect: () => router.push(`/${locale}/${def.key}/${row.id}`) },
    ...(def.key === "pages" ? [{ id: "builder", label: d.builder.openBuilder, icon: "blocks" as const, onSelect: () => router.push(`/${locale}/pages/${row.id}/builder`) }] : []),
    ...(!def.noDelete && can(`${def.permission}.delete`) ? ["divider" as const, { id: "delete", label: d.common.delete, icon: "trash" as const, danger: true, onSelect: onDelete }] : []),
  ];
  return (
    <Menu label={d.common.actions} items={items} trigger={(p) => <Button {...p} variant="ghost" size="iconSm" icon="dotsV" aria-label={d.common.actions} />} width="w-48" />
  );
}

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <div className="divide-y divide-line" aria-busy="true" aria-live="polite">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-3 py-3">
          <Skeleton className="size-4" />
          <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-2/5" /><Skeleton className="h-2.5 w-1/4" /></div>
          {Array.from({ length: Math.min(3, cols - 1) }, (_, j) => <Skeleton key={j} className="hidden h-5 w-20 rounded-full sm:block" />)}
        </div>
      ))}
    </div>
  );
}

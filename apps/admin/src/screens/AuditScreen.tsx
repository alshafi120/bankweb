"use client";

import clsx from "clsx";
import { useState } from "react";
import type { AuditLogEntry } from "@/types/api";
import type { AdminUserRecord } from "@/types/admin";
import { Dialog } from "@/components/ui/Dialog";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, ErrorState, Forbidden, PageHeader, Skeleton } from "@/components/ui/States";
import { Pagination } from "@/components/data-table/Pagination";
import { useI18n } from "@/components/providers/I18nProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { auditApi, resourceApi } from "@/lib/api/endpoints";
import { useAsync } from "@/lib/hooks/useAsync";
import { formatDateTime } from "@/lib/i18n/config";
import { downloadText, toCsv } from "@/lib/csv";

const ACTIONS: AuditLogEntry["action"][] = ["login", "logout", "login_failed", "create", "update", "delete", "publish", "approve", "reject", "change_permissions", "export", "lockout"];
const RESOURCES = ["pages", "news", "services", "offers", "branches", "users", "roles", "media", "applications", "settings"];
const TONE: Partial<Record<AuditLogEntry["action"], Tone>> = { delete: "danger", login_failed: "danger", lockout: "danger", publish: "success", approve: "success", create: "info", change_permissions: "accent", reject: "warning", export: "brand" };

export function AuditScreen() {
  const { d, locale } = useI18n();
  const { can } = useAuth();
  const [filters, setFilters] = useState({ userId: "", action: "", resourceType: "", from: "", to: "" });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [open, setOpen] = useState<AuditLogEntry | null>(null);
  const query = { page, perPage, sort: "-createdAt", ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v).map(([k, v]) => [`filter[${k}]`, v])) };
  const { data, error, loading, reload } = useAsync(() => auditApi.list(query), [JSON.stringify(query)]);
  const { data: users } = useAsync(() => (can("users.view") ? resourceApi.list<AdminUserRecord>("users", { perPage: 100 }).then((p) => p.data) : Promise.resolve([])), []);

  if (!can("audit-logs.view")) return <Forbidden />;
  const act = d.audit.actions as Record<string, string>;
  const nav = d.nav as Record<string, string>;
  const set = (k: keyof typeof filters, v: string) => { setFilters((f0) => ({ ...f0, [k]: v })); setPage(1); };
  const any = Object.values(filters).some(Boolean);

  const exportCsv = () => {
    const rows = data?.data ?? [];
    downloadText(toCsv([["id", "createdAt", "user", "action", "resourceType", "resourceId", "resourceLabel", "ip"], ...rows.map((r) => [r.id, r.createdAt, r.user?.name ?? "", r.action, r.resourceType, r.resourceId, r.resourceLabel, r.ipAddress])]), `audit-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div>
      <PageHeader title={d.audit.title} subtitle={d.audit.subtitle} actions={can("audit-logs.export") && <Button icon="download" onClick={exportCsv}>{d.common.exportCsv}</Button>} />
      <div className="card overflow-hidden">
        <div className="grid gap-2 border-b border-line p-3 sm:grid-cols-2 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto]">
          <select aria-label={d.audit.user} className="field" value={filters.userId} onChange={(e) => set("userId", e.target.value)}>
            <option value="">{d.audit.allUsers}</option>{(users ?? []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select aria-label={d.audit.action} className="field" value={filters.action} onChange={(e) => set("action", e.target.value)}>
            <option value="">{d.audit.allActions}</option>{ACTIONS.map((a) => <option key={a} value={a}>{act[a]}</option>)}
          </select>
          <select aria-label={d.audit.resource} className="field" value={filters.resourceType} onChange={(e) => set("resourceType", e.target.value)}>
            <option value="">{d.audit.allResources}</option>{RESOURCES.map((r) => <option key={r} value={r}>{nav[r] ?? r}</option>)}
          </select>
          <label className="flex items-center gap-2"><span className="w-10 shrink-0 text-xs text-muted">{d.common.from}</span><input type="date" dir="ltr" className="field num" value={filters.from} max={filters.to || undefined} onChange={(e) => set("from", e.target.value)} /></label>
          <label className="flex items-center gap-2"><span className="w-10 shrink-0 text-xs text-muted">{d.common.to}</span><input type="date" dir="ltr" className="field num" value={filters.to} min={filters.from || undefined} onChange={(e) => set("to", e.target.value)} /></label>
          {any && <Button variant="ghost" icon="close" onClick={() => { setFilters({ userId: "", action: "", resourceType: "", from: "", to: "" }); setPage(1); }}>{d.common.clear}</Button>}
        </div>
        {error ? <div className="p-4"><ErrorState error={error} onRetry={reload} /></div>
          : loading && !data ? <div className="space-y-2 p-3">{Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
          : !data?.data.length ? <EmptyState icon="history" title={d.list.emptyFiltered} />
          : (
            <div className={clsx("overflow-x-auto", loading && "opacity-60")}>
              <table className="w-full text-sm">
                <caption className="sr-only">{d.audit.title}</caption>
                <thead className="bg-raised text-xs text-muted"><tr>
                  <th scope="col" className="px-3 py-2 text-start font-semibold">{d.audit.date}</th>
                  <th scope="col" className="px-3 py-2 text-start font-semibold">{d.audit.user}</th>
                  <th scope="col" className="px-3 py-2 text-start font-semibold">{d.audit.action}</th>
                  <th scope="col" className="hidden px-3 py-2 text-start font-semibold md:table-cell">{d.audit.resource}</th>
                  <th scope="col" className="hidden px-3 py-2 text-start font-semibold lg:table-cell">{d.audit.ip}</th>
                  <th scope="col" className="w-10 px-3 py-2"><span className="sr-only">{d.common.details}</span></th>
                </tr></thead>
                <tbody>
                  {data.data.map((r) => (
                    <tr key={r.id} className="cursor-pointer border-t border-line hover:bg-raised" onClick={() => setOpen(r)}>
                      <td className="num whitespace-nowrap px-3 py-2 text-xs text-muted">{formatDateTime(r.createdAt, locale)}</td>
                      <td className="max-w-[12rem] truncate px-3 py-2">{r.user?.name ?? <span className="text-muted">{d.audit.system}</span>}</td>
                      <td className="px-3 py-2"><Badge tone={TONE[r.action] ?? "neutral"} dot>{act[r.action] ?? r.action}</Badge></td>
                      <td className="hidden max-w-[18rem] px-3 py-2 md:table-cell">
                        {r.resourceType ? <span className="block truncate"><span className="text-muted">{nav[r.resourceType] ?? r.resourceType}</span>{r.resourceLabel ? ` · ${r.resourceLabel}` : ""}</span> : "—"}
                      </td>
                      <td className="num hidden px-3 py-2 text-xs text-muted lg:table-cell" dir="ltr">{r.ipAddress}</td>
                      <td className="px-2 py-2"><Button size="iconSm" variant="ghost" icon="chevronSide" directional aria-label={`${d.audit.detail} #${r.id}`} onClick={(e) => { e.stopPropagation(); setOpen(r); }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        {data && data.meta.total > 0 && <Pagination meta={data.meta} perPage={perPage} onPage={setPage} onPerPage={(n) => { setPerPage(n); setPage(1); }} />}
      </div>
      {open && <AuditDrawer entry={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function AuditDrawer({ entry, onClose }: { entry: AuditLogEntry; onClose: () => void }) {
  const { d, locale } = useI18n();
  const before = entry.changes?.before ?? {};
  const after = entry.changes?.after ?? {};
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  const show = (v: unknown) => (v === undefined ? "—" : typeof v === "string" ? v : JSON.stringify(v, null, 1));
  return (
    <Dialog open onClose={onClose} side="end" title={`${d.audit.detail} #${entry.id}`} description={formatDateTime(entry.createdAt, locale)}>
      <dl className="mb-5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted">{d.audit.user}</dt><dd>{entry.user?.name ?? d.audit.system}</dd>
        <dt className="text-muted">{d.audit.action}</dt><dd>{(d.audit.actions as Record<string, string>)[entry.action]}</dd>
        <dt className="text-muted">{d.audit.resource}</dt><dd>{entry.resourceType ? `${(d.nav as Record<string, string>)[entry.resourceType] ?? entry.resourceType} #${entry.resourceId ?? ""}` : "—"}{entry.resourceLabel ? ` · ${entry.resourceLabel}` : ""}</dd>
        <dt className="text-muted">{d.audit.ip}</dt><dd className="num" dir="ltr">{entry.ipAddress}</dd>
        <dt className="text-muted">{d.audit.userAgent}</dt><dd className="break-all text-xs" dir="ltr">{entry.userAgent}</dd>
      </dl>
      {keys.length === 0 ? <p className="rounded-lg bg-raised p-4 text-center text-sm text-muted">{d.audit.noChanges}</p> : (
        <div className="overflow-hidden rounded-card border border-line">
          <table className="w-full table-fixed text-xs">
            <thead className="bg-raised text-muted"><tr>
              <th scope="col" className="w-1/4 px-2.5 py-2 text-start font-semibold">{d.audit.field}</th>
              <th scope="col" className="px-2.5 py-2 text-start font-semibold">{d.audit.before}</th>
              <th scope="col" className="px-2.5 py-2 text-start font-semibold">{d.audit.after}</th>
            </tr></thead>
            <tbody>
              {keys.map((k) => {
                const changed = JSON.stringify(before[k]) !== JSON.stringify(after[k]);
                return (
                  <tr key={k} className="border-t border-line align-top">
                    <th scope="row" className="num px-2.5 py-2 text-start font-semibold" dir="ltr">
                      {k}{changed && <span className="ms-1 inline-block size-1.5 rounded-full bg-accent align-middle" title={d.audit.changed} />}
                    </th>
                    <td className={clsx("whitespace-pre-wrap break-words px-2.5 py-2", changed && before[k] !== undefined && "bg-danger/[.07] text-danger line-through decoration-danger/40")}>{show(before[k])}</td>
                    <td className={clsx("whitespace-pre-wrap break-words px-2.5 py-2", changed && after[k] !== undefined && "bg-success/[.08] text-success")}>{show(after[k])}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 flex items-center gap-1.5 text-2xs text-muted"><Icon name="lock" className="size-3.5" />{d.audit.subtitle}</p>
    </Dialog>
  );
}

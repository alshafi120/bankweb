"use client";

import clsx from "clsx";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { ApplicationStatus } from "@/types/api";
import type { AdminUserRecord, InboxKind, InboxRecord } from "@/types/admin";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Tabs } from "@/components/ui/Controls";
import { StatusBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, ErrorState, Forbidden, PageHeader, Skeleton } from "@/components/ui/States";
import { Pagination } from "@/components/data-table/Pagination";
import { useI18n } from "@/components/providers/I18nProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { inboxApi, resourceApi } from "@/lib/api/endpoints";
import { useAsync, useDebounced } from "@/lib/hooks/useAsync";
import { formatDateTime, formatMoney, formatNumber, formatRelative } from "@/lib/i18n/config";
import { downloadText } from "@/lib/csv";
import { dataUrlToBlobUrl } from "@/components/media/mediaUtils";

const PIPELINE: ApplicationStatus[] = ["new", "in_review", "contacted", "approved", "rejected", "closed"];
type AppTab = "account" | "financing" | "card";

/** Requests inbox: status pipeline chips, tabs (applications only), assignment, notes thread, masked PII, signed downloads, CSV export. */
export function InboxScreen({ kind }: { kind: InboxKind }) {
  const { d, f, locale } = useI18n();
  const { can } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const tab = (sp.get("tab") as AppTab | null) ?? "account";
  const status = sp.get("status") ?? "";
  const page = Number(sp.get("page") ?? 1);
  const perPage = Number(sp.get("perPage") ?? 15);
  const assigned = sp.get("assigned") ?? "";
  const [search, setSearch] = useState("");
  const q = useDebounced(search, 300);
  const [openId, setOpenId] = useState<number | null>(sp.get("open") ? Number(sp.get("open")) : null);

  const setParams = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) { if (v === null || v === "") next.delete(k); else next.set(k, String(v)); }
    if (!("page" in patch)) next.delete("page");
    next.delete("open");
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  const query = { page, perPage, search: q, status, sort: "-createdAt", ...(kind === "applications" ? { "filter[type]": tab } : {}), ...(assigned ? { "filter[assignedTo]": assigned } : {}) };
  const { data, error, loading, reload, setData } = useAsync(() => inboxApi.list(kind, query), [kind, JSON.stringify(query)]);
  const { data: staff } = useAsync(() => (can("users.view") ? resourceApi.list<AdminUserRecord>("users", { perPage: 100, "filter[isActive]": "true" }).then((p) => p.data) : Promise.resolve([] as AdminUserRecord[])), [kind]);

  if (!can(`${kind}.view`)) return <Forbidden />;
  const title = (d.nav as Record<string, string>)[kind] ?? kind;
  const canUpdate = can(`${kind}.update`);

  const exportCsv = async () => {
    try {
      const text = await inboxApi.exportCsv(kind, { status, search: q, ...(kind === "applications" ? { "filter[type]": tab } : {}) });
      downloadText(text, `${kind}-${new Date().toISOString().slice(0, 10)}.csv`);
      toast({ tone: "success", title: d.common.exportCsv });
    } catch { toast({ tone: "error", title: d.errors.generic }); }
  };

  const replaceRow = (r: InboxRecord) => { if (data) setData({ ...data, data: data.data.map((x) => (x.id === r.id ? r : x)) }); };
  const rows = data?.data ?? [];
  const current = rows.find((r) => r.id === openId) ?? null;

  return (
    <div>
      <PageHeader title={title} subtitle={d.inbox.masked}
        actions={can(`${kind}.export`) && <Button icon="download" onClick={exportCsv}>{d.common.exportCsv}</Button>} />

      <div className="card overflow-hidden">
        {kind === "applications" && (
          <Tabs label={title} className="px-3 pt-1" value={tab} onChange={(t) => setParams({ tab: t })}
            tabs={(["account", "financing", "card"] as AppTab[]).map((t) => ({ id: t, label: <span className="inline-flex items-center gap-1.5"><Icon name={t === "account" ? "account" : t === "financing" ? "financing" : "card"} className="size-4" />{d.inbox.tabs[t]}</span> }))} />
        )}
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <div className="relative min-w-0 flex-1 basis-56">
            <Icon name="search" className="pointer-events-none absolute inset-y-0 start-2.5 my-auto size-4 text-muted" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${d.inbox.reference} / ${d.inbox.name}`} aria-label={d.common.search} className="field ps-8" />
          </div>
          {staff && staff.length > 0 && (
            <select aria-label={d.inbox.assigned} className="field w-auto max-w-[14rem]" value={assigned} onChange={(e) => setParams({ assigned: e.target.value || null })}>
              <option value="">{d.inbox.assigned}: {d.common.all}</option>
              <option value="none">{d.inbox.unassigned}</option>
              {staff.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}
        </div>
        <div className="scrollbar-thin flex gap-1.5 overflow-x-auto border-b border-line px-3 py-2" role="group" aria-label={d.inbox.pipeline}>
          {["", ...PIPELINE].map((s) => (
            <button key={s || "all"} type="button" aria-pressed={status === s} onClick={() => setParams({ status: s || null })}
              className={clsx("h-7 shrink-0 rounded-full border px-3 text-xs font-semibold", status === s ? "border-brand-700 bg-brand-100 text-brand-700" : "border-line text-muted hover:text-ink")}>
              {s ? (d.status as Record<string, string>)[s] : d.common.all}
            </button>
          ))}
        </div>

        {error ? <div className="p-4"><ErrorState error={error} onRetry={reload} /></div>
          : loading && !data ? <div className="space-y-2 p-3">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          : rows.length === 0 ? <EmptyState icon="inbox" title={d.list.emptyFiltered} />
          : (
            <ul className={clsx("divide-y divide-line", loading && "opacity-60")}>
              {rows.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => setOpenId(r.id)} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-3 py-2.5 text-start hover:bg-raised sm:grid-cols-[150px_minmax(0,1.3fr)_minmax(0,1fr)_auto_auto]">
                    <span className="num text-xs font-semibold text-brand-700" dir="ltr">{r.reference}</span>
                    <span className="order-3 min-w-0 sm:order-none">
                      <span className="block truncate text-sm font-medium">{r.fullName}</span>
                      <span className="num block truncate text-xs text-muted" dir="ltr">{r.phoneMasked}</span>
                    </span>
                    <span className="order-4 hidden min-w-0 truncate text-xs text-muted sm:order-none sm:block">{r.city} · {r.assignedTo?.name ?? d.inbox.unassigned}</span>
                    <span className="order-2 justify-self-end sm:order-none"><StatusBadge status={r.status} /></span>
                    <span className="order-5 hidden text-end text-xs text-muted sm:order-none sm:block">{formatRelative(r.createdAt, locale)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        {data && data.meta.total > 0 && <Pagination meta={data.meta} perPage={perPage} onPage={(p) => setParams({ page: p })} onPerPage={(n) => setParams({ perPage: n })} />}
      </div>

      {current && <RequestDrawer kind={kind} record={current} staff={staff ?? []} canUpdate={canUpdate} onClose={() => setOpenId(null)} onChange={replaceRow} />}
      {openId && !current && !loading && <DeepLinkLoader kind={kind} id={openId} onLoaded={(r) => data && setData({ ...data, data: [r, ...data.data] })} onFail={() => setOpenId(null)} />}
      <span className="sr-only" aria-live="polite">{data ? f(d.list.showing, { from: 1, to: rows.length, total: formatNumber(data.meta.total, locale) }) : ""}</span>
    </div>
  );
}

function DeepLinkLoader({ kind, id, onLoaded, onFail }: { kind: InboxKind; id: number; onLoaded: (r: InboxRecord) => void; onFail: () => void }) {
  useEffect(() => { inboxApi.get(kind, id).then(onLoaded).catch(onFail); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [kind, id]);
  return null;
}

function RequestDrawer({ kind, record, staff, canUpdate, onClose, onChange }: {
  kind: InboxKind; record: InboxRecord; staff: AdminUserRecord[]; canUpdate: boolean; onClose: () => void; onChange: (r: InboxRecord) => void;
}) {
  const { d, f, locale } = useI18n();
  const toast = useToast();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const keys = d.inbox.detailKeys as Record<string, string>;

  const patch = async (body: { status?: ApplicationStatus; assignedTo?: number | null }, msg: string) => {
    setBusy("patch");
    try { onChange(await inboxApi.patch(kind, record.id, body)); toast({ tone: "success", title: msg }); }
    catch { toast({ tone: "error", title: d.errors.generic }); } finally { setBusy(null); }
  };
  const addNote = async () => {
    if (!note.trim()) return;
    setBusy("note");
    try { onChange(await inboxApi.addNote(kind, record.id, note.trim())); setNote(""); toast({ tone: "success", title: d.inbox.noteAdded }); }
    catch { toast({ tone: "error", title: d.errors.generic }); } finally { setBusy(null); }
  };
  const download = async () => {
    if (kind !== "complaints" && kind !== "job-applications") return;
    setBusy("file");
    try {
      const s = await inboxApi.signedFile(kind, record.id);
      const href = s.url.startsWith("data:") ? dataUrlToBlobUrl(s.url) : s.url;
      const a = document.createElement("a"); a.href = href; a.download = s.filename; a.rel = "noopener noreferrer"; document.body.appendChild(a); a.click(); a.remove();
      if (href.startsWith("blob:")) setTimeout(() => URL.revokeObjectURL(href), 2000);
      toast({ tone: "info", title: d.inbox.signed });
    } catch { toast({ tone: "error", title: d.errors.generic }); } finally { setBusy(null); }
  };
  const fmtDetail = (k: string, v: unknown) => {
    if (typeof v === "boolean") return v ? d.common.yes : d.common.no;
    if (typeof v === "number" && (k === "amount" || k === "monthlyIncome")) return formatMoney(v, locale);
    if (typeof v === "number") return formatNumber(v, locale);
    return String(v ?? "—");
  };
  const fileAvailable = kind === "job-applications" || (kind === "complaints" && !!record.details.hasAttachment);

  return (
    <Dialog open onClose={onClose} side="end" title={<span className="num" dir="ltr">{record.reference}</span>} description={`${record.fullName} · ${formatDateTime(record.createdAt, locale)}`}>
      <div className="space-y-5">
        {/* Pipeline */}
        <section aria-labelledby="pl-h">
          <h3 id="pl-h" className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{d.inbox.pipeline}</h3>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={d.inbox.pipeline}>
            {PIPELINE.map((s) => (
              <button key={s} type="button" role="radio" aria-checked={record.status === s} disabled={!canUpdate || busy === "patch"}
                onClick={() => record.status !== s && patch({ status: s }, f(d.inbox.statusChanged, { status: (d.status as Record<string, string>)[s] ?? s }))}
                className={clsx("inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed",
                  record.status === s ? "border-brand-700 bg-brand-900 text-white dark:bg-brand-700 dark:text-bg" : "border-line hover:border-brand-700")}>
                {record.status === s && <Icon name="check" className="size-3.5" />}{(d.status as Record<string, string>)[s]}
              </button>
            ))}
          </div>
        </section>

        {/* Assign */}
        <section className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="assign" className="label">{d.inbox.assign}</label>
            <select id="assign" className="field" disabled={!canUpdate || busy === "patch"} value={record.assignedTo?.id ?? ""}
              onChange={(e) => patch({ assignedTo: e.target.value ? Number(e.target.value) : null }, d.inbox.assignedOk)}>
              <option value="">{d.inbox.unassigned}</option>
              {record.assignedTo && !staff.some((u) => u.id === record.assignedTo!.id) && <option value={record.assignedTo.id}>{record.assignedTo.name}</option>}
              {staff.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          {fileAvailable && <div className="flex items-end"><Button icon="download" className="w-full" loading={busy === "file"} onClick={download}>{kind === "complaints" ? d.inbox.attachment : d.inbox.cv}</Button></div>}
        </section>

        {/* Applicant */}
        <section aria-labelledby="ap-h" className="rounded-card border border-line">
          <h3 id="ap-h" className="border-b border-line px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted">{d.inbox.requestDetails}</h3>
          <dl className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-4 gap-y-2 p-3 text-sm">
            <dt className="text-muted">{d.inbox.name}</dt><dd>{record.fullName}</dd>
            <dt className="text-muted">{d.inbox.phone}</dt><dd className="num" dir="ltr">{record.phoneMasked}</dd>
            {record.nationalIdMasked !== "—" && <><dt className="text-muted">{d.inbox.nationalId}</dt><dd className="num" dir="ltr">{record.nationalIdMasked}</dd></>}
            <dt className="text-muted">{d.inbox.email}</dt><dd className="truncate" dir="ltr">{record.email ?? "—"}</dd>
            <dt className="text-muted">{d.inbox.city}</dt><dd>{record.city}</dd>
            <dt className="text-muted">{d.inbox.locale}</dt><dd className="uppercase">{record.locale}</dd>
            {Object.entries(record.details).map(([k, v]) => <div key={k} className="contents"><dt className="text-muted">{keys[k] ?? k}</dt><dd className="min-w-0 break-words">{fmtDetail(k, v)}</dd></div>)}
          </dl>
          <p className="flex items-center gap-1.5 border-t border-line px-3 py-2 text-2xs text-muted"><Icon name="lock" className="size-3.5" />{d.inbox.masked}</p>
        </section>

        {/* Notes */}
        <section aria-labelledby="nt-h">
          <h3 id="nt-h" className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{d.inbox.notes}</h3>
          {record.notes.length === 0 ? <p className="text-sm text-muted">{d.inbox.noNotes}</p> : (
            <ol className="space-y-2">
              {record.notes.map((n) => (
                <li key={n.id} className="rounded-lg bg-raised p-2.5">
                  <p className="mb-0.5 flex items-center justify-between gap-2 text-xs"><span className="font-semibold">{n.author}</span><span className="text-muted">{formatRelative(n.createdAt, locale)}</span></p>
                  <p className="whitespace-pre-wrap text-sm">{n.body}</p>
                </li>
              ))}
            </ol>
          )}
          {canUpdate && (
            <div className="mt-3">
              <label htmlFor="note" className="sr-only">{d.inbox.addNote}</label>
              <textarea id="note" rows={3} maxLength={2000} className="field" placeholder={d.inbox.notePlaceholder} value={note} onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") void addNote(); }} />
              <div className="mt-2 flex justify-end"><Button variant="primary" size="sm" icon="send2" directional loading={busy === "note"} disabled={!note.trim()} onClick={addNote}>{d.inbox.addNote}</Button></div>
            </div>
          )}
        </section>
      </div>
    </Dialog>
  );
}

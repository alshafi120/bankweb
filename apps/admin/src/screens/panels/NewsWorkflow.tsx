"use client";

import clsx from "clsx";
import { useState } from "react";
import type { AnyRecord, AdminNews } from "@/types/admin";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { StatusBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { toLocalInput } from "@/components/forms/ResourceForm";
import { useI18n } from "@/components/providers/I18nProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { newsApi } from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/i18n/config";

/**
 * Draft → Submit for review → Approve / Reject (reason) → Publish / Schedule.
 * Buttons appear according to status + permissions; an author can never approve their own article (maker/checker).
 */
export function NewsWorkflow({ record, dirty, onChange }: { record: AnyRecord; dirty: boolean; onChange: (r: AnyRecord) => void }) {
  const n = record as unknown as AdminNews;
  const { d, f, locale } = useI18n();
  const { can, user } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [when, setWhen] = useState(() => toLocalInput(new Date(Date.now() + 86_400_000).toISOString()));

  const own = !!user && n.author?.id === user.id;
  const run = async (key: string, fn: () => Promise<AdminNews>, ok: string) => {
    setBusy(key);
    try { onChange((await fn()) as unknown as AnyRecord); toast({ tone: "success", title: ok }); return true; }
    catch (e) {
      const msg = isApiError(e) ? (e.kind === "forbidden" ? (key === "approve" ? d.news.ownArticle : d.errors.forbidden) : Object.values(e.fieldErrors)[0]?.[0] ?? e.message) : d.errors.generic;
      toast({ tone: "error", title: msg }); return false;
    } finally { setBusy(null); }
  };

  const steps = [
    { key: "draft", label: d.news.steps.draft, done: n.status !== "draft" },
    { key: "review", label: d.news.steps.review, done: ["approved", "scheduled", "published", "archived"].includes(n.status), current: n.status === "pending_review" },
    { key: "approved", label: d.news.steps.approved, done: ["scheduled", "published", "archived"].includes(n.status), current: n.status === "approved" },
    { key: "live", label: d.news.steps.live, done: n.status === "published", current: n.status === "scheduled" },
  ];

  const canApprove = can("news.approve");
  const canPublish = can("news.publish");

  return (
    <section className="card p-4" aria-labelledby="wf-title">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="wf-title" className="text-sm font-bold">{d.news.workflow}</h2>
        <StatusBadge status={n.status} />
      </div>
      <ol className="mb-4 flex items-center gap-1" aria-label={d.news.workflow}>
        {steps.map((s, i) => (
          <li key={s.key} className="flex flex-1 flex-col items-center gap-1 text-center" aria-current={s.current ? "step" : undefined}>
            <span className="flex w-full items-center">
              <span className={clsx("h-0.5 flex-1", i === 0 ? "opacity-0" : s.done || s.current ? "bg-brand-700" : "bg-line")} />
              <span className={clsx("grid size-6 shrink-0 place-items-center rounded-full border-2 text-2xs font-bold",
                s.done ? "border-brand-700 bg-brand-700 text-white dark:text-bg" : s.current ? "border-accent bg-accent/15 text-accent" : "border-line text-muted")}>
                {s.done ? <Icon name="check" className="size-3.5" /> : i + 1}
              </span>
              <span className={clsx("h-0.5 flex-1", i === steps.length - 1 ? "opacity-0" : s.done ? "bg-brand-700" : "bg-line")} />
            </span>
            <span className={clsx("text-2xs", s.current ? "font-semibold text-ink" : "text-muted")}>{s.label}</span>
          </li>
        ))}
      </ol>

      {n.status === "scheduled" && n.publishAt && <p className="mb-3 flex items-center gap-1.5 text-xs text-accent"><Icon name="clock" className="size-3.5" />{f(d.news.scheduledFor, { date: formatDateTime(n.publishAt, locale) })}</p>}
      {n.status === "published" && n.publishedAt && <p className="mb-3 text-xs text-muted">{f(d.news.publishedAt, { date: formatDateTime(n.publishedAt, locale) })}</p>}
      {n.reviewNote && n.status === "draft" && (
        <div className="mb-3 rounded-lg border border-danger/30 bg-danger/5 p-2.5 text-xs">
          <p className="font-semibold text-danger">{d.news.reviewNote}{n.reviewedBy ? ` — ${n.reviewedBy.name}` : ""}</p>
          <p className="mt-0.5">{n.reviewNote}</p>
        </div>
      )}
      {dirty && n.status !== "published" && <p className="mb-3 text-xs text-warning">{d.news.saveFirst}</p>}

      <div className="flex flex-col gap-2">
        {n.status === "draft" && can("news.update") && (
          <Button variant="primary" icon="send2" directional loading={busy === "submit"} disabled={dirty} onClick={() => run("submit", () => newsApi.submit(n.id), d.news.submitted)}>{d.news.submit}</Button>
        )}
        {n.status === "pending_review" && (canApprove ? (
          <>
            <Button variant="primary" icon="check" loading={busy === "approve"} disabled={own || dirty} aria-describedby={own ? "own-note" : undefined}
              onClick={() => run("approve", () => newsApi.approve(n.id), d.news.approved)}>{d.news.approve}</Button>
            <Button variant="secondary" icon="xCircle" disabled={dirty} onClick={() => setRejectOpen(true)}>{d.news.reject}</Button>
            {own && <p id="own-note" className="flex gap-1.5 rounded-lg bg-warning/10 p-2 text-xs text-ink/85"><Icon name="info" className="mt-0.5 size-3.5 text-warning" />{d.news.ownArticle}</p>}
          </>
        ) : <p className="text-xs text-muted">{d.news.noApprove}</p>)}
        {(n.status === "approved" || n.status === "scheduled") && (canPublish ? (
          <>
            <Button variant="accent" icon="send2" directional loading={busy === "publish"} disabled={dirty} onClick={() => run("publish", () => newsApi.publish(n.id), d.news.publishedOk)}>{d.news.publish}</Button>
            <Button variant="secondary" icon="calendar" disabled={dirty} onClick={() => setScheduleOpen(true)}>{d.news.schedule}</Button>
          </>
        ) : <p className="text-xs text-muted">{d.news.noPublish}</p>)}
      </div>

      <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 border-t border-line pt-3 text-xs">
        <dt className="text-muted">{d.news.author}</dt><dd>{n.author?.name ?? "—"}</dd>
        {n.reviewedBy && <><dt className="text-muted">{d.news.reviewedBy}</dt><dd>{n.reviewedBy.name}</dd></>}
      </dl>

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} title={d.news.rejectTitle} size="sm"
        footer={<>
          <Button onClick={() => setRejectOpen(false)}>{d.common.cancel}</Button>
          <Button variant="danger" loading={busy === "reject"} disabled={reason.trim().length < 5}
            onClick={async () => { if (await run("reject", () => newsApi.reject(n.id, reason.trim()), d.news.rejected)) { setRejectOpen(false); setReason(""); } }}>{d.news.reject}</Button>
        </>}>
        <label htmlFor="reject-reason" className="label">{d.news.rejectReason}</label>
        <textarea id="reject-reason" data-autofocus rows={4} className="field" value={reason} onChange={(e) => setReason(e.target.value)} aria-describedby="reject-hint" />
        <p id="reject-hint" className="hint">{d.news.rejectReasonHint}</p>
      </Dialog>

      <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} title={d.news.schedule} size="sm"
        footer={<>
          <Button onClick={() => setScheduleOpen(false)}>{d.common.cancel}</Button>
          <Button variant="primary" icon="calendar" loading={busy === "schedule"} disabled={!when || new Date(when).getTime() <= Date.now()}
            onClick={async () => { const iso = new Date(when).toISOString(); if (await run("schedule", () => newsApi.schedule(n.id, iso), f(d.news.scheduledOk, { date: formatDateTime(iso, locale) }))) setScheduleOpen(false); }}>{d.news.schedule}</Button>
        </>}>
        <label htmlFor="sched" className="label">{d.builder.publishAt}</label>
        <input id="sched" data-autofocus type="datetime-local" dir="ltr" className="field num" value={when} min={toLocalInput(new Date().toISOString())} onChange={(e) => setWhen(e.target.value)} />
      </Dialog>
    </section>
  );
}

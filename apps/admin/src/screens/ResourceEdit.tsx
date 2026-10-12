"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { AnyRecord } from "@/types/admin";
import type { ResourceDef } from "@/resources/types";
import { ResourceForm } from "@/components/forms/ResourceForm";
import { validateRecord, fromServer, type Errors } from "@/components/forms/validate";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ErrorState, Forbidden, PageHeader, Skeleton } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { useBreadcrumbLabel } from "@/components/shell/Breadcrumbs";
import { useI18n } from "@/components/providers/I18nProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { resourceApi } from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/errors";
import { useAsync, useDirtyGuard, invalidateRelation } from "@/lib/hooks/useAsync";
import { formatDateTime, tl } from "@/lib/i18n/config";
import { NewsWorkflow } from "./panels/NewsWorkflow";
import { UserSecurity } from "./panels/UserSecurity";

const stable = (v: unknown) => JSON.stringify(v, Object.keys((v ?? {}) as object).sort());

/** Generic create/edit screen with validation, 422 mapping, dirty guard, sticky save bar, delete confirmation and aside panels. */
export function ResourceEdit({ def, id }: { def: ResourceDef; id: string | null }) {
  const isNew = id === null;
  const { d, f, locale } = useI18n();
  const { can } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const { data: record, error, loading, setData: setRecord } = useAsync<AnyRecord | null>(
    () => (isNew ? Promise.resolve(null) : resourceApi.get<AnyRecord>(def.endpoint, id!)), [def.endpoint, id]);

  const initial = useMemo<Record<string, unknown>>(() => {
    if (isNew) return def.defaults();
    if (!record) return {};
    return { ...def.defaults(), ...record };
  }, [isNew, record, def]);

  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [baseline, setBaseline] = useState(() => stable(initial));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { setValues(initial); setBaseline(stable(initial)); setErrors({}); }, [initial]);

  const dirty = stable(values) !== baseline;
  useDirtyGuard(dirty, d.common.unsavedLeave);

  const res = (d.resources as Record<string, { one: string; many: string }>)[def.key];
  const one = res?.one ?? tl(def.title.one, locale);
  const labelRaw = values[def.labelKey];
  const recordLabel = typeof labelRaw === "string" ? labelRaw : tl(labelRaw as { ar: string; en: string } | undefined, locale);
  useBreadcrumbLabel(isNew ? null : recordLabel || `#${id}`);

  if (!can(`${def.permission}.view`) || (isNew && !can(`${def.permission}.create`))) return <Forbidden />;
  if (error) return <ErrorState error={error} />;
  if (!isNew && (loading || !record)) return <EditSkeleton />;

  const canWrite = isNew ? can(`${def.permission}.create`) : can(`${def.permission}.update`);
  const readOnly = !canWrite;

  const save = async () => {
    const errs = validateRecord(def.fields, values, d, isNew);
    setErrors(errs);
    if (Object.keys(errs).length) { toast({ tone: "error", title: d.form.invalid }); return; }
    setSaving(true);
    try {
      const body = { ...values };
      delete body.id; delete body.createdAt; delete body.updatedAt;
      if (!isNew && def.key === "users") delete body.password;
      const saved = isNew ? await resourceApi.create<AnyRecord>(def.endpoint, body) : await resourceApi.update<AnyRecord>(def.endpoint, id!, body);
      invalidateRelation(def.endpoint);
      toast({ tone: "success", title: isNew ? d.form.created : d.form.updated });
      if (isNew) { setBaseline(stable(values)); router.replace(`/${locale}/${def.key}/${saved.id}`); }
      else { setRecord(saved); }
    } catch (e) {
      if (isApiError(e) && e.kind === "validation") { setErrors(fromServer(e.fieldErrors)); toast({ tone: "error", title: d.form.invalid, body: e.message }); }
      else if (isApiError(e) && e.kind === "forbidden") toast({ tone: "error", title: d.errors.forbidden, body: d.errors.forbiddenBody });
      else if (isApiError(e) && e.kind === "rate_limited") toast({ tone: "error", title: f(d.errors.rateLimited, { seconds: e.retryAfter ?? 30 }) });
      else if (isApiError(e) && e.kind === "locked") toast({ tone: "error", title: d.errors.locked });
      else toast({ tone: "error", title: d.errors.generic });
    } finally { setSaving(false); }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await resourceApi.remove(def.endpoint, id!);
      invalidateRelation(def.endpoint);
      setBaseline(stable(values)); // disarm guard
      toast({ tone: "success", title: d.list.deleted });
      router.replace(`/${locale}/${def.key}`);
    } catch (e) {
      toast({ tone: "error", title: isApiError(e) && e.kind === "validation" ? Object.values(e.fieldErrors)[0]?.[0] ?? d.errors.generic : d.errors.generic });
    } finally { setDeleting(false); setConfirmDel(false); }
  };

  const aside: ReactNode[] = [];
  if (!isNew && record) {
    if (def.aside?.includes("newsWorkflow")) aside.push(<NewsWorkflow key="wf" record={record} dirty={dirty} onChange={(r) => { setRecord(r); }} />);
    if (def.aside?.includes("userSecurity")) aside.push(<UserSecurity key="sec" record={record} onChange={setRecord} />);
    if (def.aside?.includes("pageBuilder")) aside.push(
      <div key="pb" className="card p-4">
        <p className="mb-1 text-sm font-bold">{d.builder.title}</p>
        <p className="mb-3 text-xs text-muted">{((record.sections as unknown[]) ?? []).length} {d.builder.sections}</p>
        <ButtonLink href={`/${locale}/pages/${record.id}/builder`} variant="subtle" icon="blocks" className="w-full">{d.builder.openBuilder}</ButtonLink>
      </div>,
    );
    aside.push(
      <dl key="meta" className="card grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 p-4 text-xs">
        {"status" in record && <><dt className="text-muted">{d.common.status}</dt><dd><StatusBadge status={String(record.status)} /></dd></>}
        <dt className="text-muted">{d.common.createdAt}</dt><dd className="num">{formatDateTime(record.createdAt as string, locale)}</dd>
        <dt className="text-muted">{d.common.updatedAt}</dt><dd className="num">{formatDateTime(record.updatedAt as string, locale)}</dd>
        <dt className="text-muted">ID</dt><dd className="num">{record.id}</dd>
      </dl>,
    );
  }

  return (
    <div className="pb-6">
      <PageHeader
        eyebrow={<ButtonLink href={`/${locale}/${def.key}`} variant="ghost" size="sm" icon="back" directional className="-ms-2.5">{res?.many ?? tl(def.title.many, locale)}</ButtonLink>}
        title={isNew ? f(d.form.newTitle, { item: one }) : recordLabel || f(d.form.editTitle, { item: one })}
        actions={!isNew && !def.noDelete && can(`${def.permission}.delete`) ? <Button variant="ghost" icon="trash" className="text-danger" onClick={() => setConfirmDel(true)}>{f(d.form.deleteItem, { item: one })}</Button> : undefined} />

      {readOnly && <div role="status" className="mb-4 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm"><Icon name="lock" className="size-4 text-warning" />{d.form.noPermission}</div>}

      <form onSubmit={(e) => { e.preventDefault(); void save(); }} noValidate>
        <div className={clsx("grid gap-4", aside.length && "xl:grid-cols-[minmax(0,1fr)_300px]")}>
          <ResourceForm def={def} values={values} onChange={(patch) => setValues((v) => ({ ...v, ...patch }))} errors={errors} readOnly={readOnly} isNew={isNew} />
          {aside.length > 0 && <aside className="space-y-4">{aside}</aside>}
        </div>

        {canWrite && (
          <div className={clsx("sticky bottom-3 z-30 mt-4 flex flex-wrap items-center gap-3 rounded-card border bg-surface/95 px-4 py-2.5 shadow-pop backdrop-blur transition",
            dirty ? "border-accent/50" : "border-line")}>
            <span className="flex min-w-0 flex-1 items-center gap-2 text-sm">
              {dirty ? <><span className="size-2 rounded-full bg-accent" aria-hidden="true" /><span className="font-semibold">{d.form.saveBar}</span></>
                : !isNew && record ? <span className="truncate text-muted">{f(d.form.lastSaved, { time: formatDateTime(record.updatedAt as string, locale) })}</span> : null}
              {Object.keys(errors).length > 0 && <span className="text-danger">· {f(d.form.errorsInTab, { count: Object.keys(errors).length })}</span>}
            </span>
            {dirty && !isNew && <Button variant="ghost" onClick={() => { setValues(initial); setErrors({}); }}>{d.common.discard}</Button>}
            <Button type="submit" variant="primary" icon="check" loading={saving} disabled={!dirty && !isNew}>{isNew ? d.common.create : d.common.save}</Button>
          </div>
        )}
      </form>

      <ConfirmDialog open={confirmDel} onClose={() => setConfirmDel(false)} onConfirm={remove} loading={deleting} title={d.list.deleteConfirmTitle}
        body={f(d.list.deleteConfirm, { name: recordLabel || `#${id}` })} confirmLabel={d.common.delete} />
    </div>
  );
}

function EditSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4">
      <Skeleton className="h-4 w-24" /><Skeleton className="h-7 w-72" />
      <div className="card space-y-4 p-5">
        <Skeleton className="h-8 w-64" />
        {Array.from({ length: 5 }, (_, i) => <div key={i} className="space-y-1.5"><Skeleton className="h-3 w-28" /><Skeleton className="h-9 w-full" /></div>)}
      </div>
    </div>
  );
}

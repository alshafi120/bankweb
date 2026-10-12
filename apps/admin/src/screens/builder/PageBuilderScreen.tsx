"use client";

import clsx from "clsx";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import type { BlockType } from "@/types/api";
import type { AdminPage, AdminPageSection, SectionType } from "@/types/admin";
import { GENERIC_BLOCKS, HOME_BLOCKS, blockIcon, defaultData, isHomeBlock } from "@/components/page-builder/blocks";
import { BlockForm } from "@/components/page-builder/BlockForm";
import { SectionPreview } from "@/components/page-builder/Preview";
import { toLocalInput } from "@/components/forms/ResourceForm";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { Segmented, Switch, Tabs } from "@/components/ui/Controls";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, Forbidden, Skeleton } from "@/components/ui/States";
import { useBreadcrumbLabel } from "@/components/shell/Breadcrumbs";
import { useI18n } from "@/components/providers/I18nProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { pagesApi, resourceApi } from "@/lib/api/endpoints";
import { useAsync, useDirtyGuard } from "@/lib/hooks/useAsync";
import { formatDateTime, tl } from "@/lib/i18n/config";
import { isApiError } from "@/lib/api/errors";

let tmp = -1;

export function PageBuilderScreen({ id }: { id: string }) {
  const { d, f, locale } = useI18n();
  const { can } = useAuth();
  const toast = useToast();
  const { data: page, error, loading, setData: setPage } = useAsync(() => resourceApi.get<AdminPage>("pages", id), [id]);

  const [sections, setSections] = useState<AdminPageSection[]>([]);
  const [baseline, setBaseline] = useState("[]");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [lang, setLang] = useState<"ar" | "en">(locale);
  const [previewLang, setPreviewLang] = useState<"ar" | "en">(locale);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<AdminPageSection | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [publishAt, setPublishAt] = useState(() => toLocalInput(new Date(Date.now() + 86_400_000).toISOString()));
  const [busy, setBusy] = useState<string | null>(null);
  const [mobilePane, setMobilePane] = useState<"edit" | "preview">("edit");
  const [announce, setAnnounce] = useState("");
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (!page) return;
    setSections(page.sections);
    setBaseline(JSON.stringify(page.sections));
    setSelectedId((s) => s ?? page.sections[0]?.id ?? null);
  }, [page]);

  const dirty = JSON.stringify(sections) !== baseline;
  useDirtyGuard(dirty, d.common.unsavedLeave);
  useBreadcrumbLabel(page ? tl(page.title, locale) : null);

  const selected = sections.find((s) => s.id === selectedId) ?? null;
  const blockName = (t: SectionType) => (d.builder.blocks as Record<string, string>)[t] ?? t;
  const isHome = page?.template === "home" || page?.slug === "home";
  const canEdit = can("pages.update");
  const canPublish = can("pages.publish");

  const update = (sid: number, patch: Partial<AdminPageSection>) => setSections((all) => all.map((s) => (s.id === sid ? { ...s, ...patch } : s)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= sections.length || from === to) return;
    setSections((all) => { const a = all.slice(); const [x] = a.splice(from, 1); a.splice(to, 0, x!); return a; });
    setAnnounce(f(d.builder.moved, { n: to + 1 }));
  };
  const add = (type: SectionType) => {
    const s: AdminPageSection = { id: tmp--, type, data: isHomeBlock(type) ? {} : defaultData(type as BlockType), isVisible: true, startsAt: null, endsAt: null };
    const at = selected ? sections.findIndex((x) => x.id === selected.id) + 1 : sections.length;
    setSections((all) => { const a = all.slice(); a.splice(at, 0, s); return a; });
    setSelectedId(s.id); setPaletteOpen(false);
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>(`[data-sid="${s.id}"]`)?.focus());
  };
  const duplicate = (s: AdminPageSection) => {
    const copy = { ...structuredClone(s), id: tmp-- };
    const i = sections.findIndex((x) => x.id === s.id);
    setSections((all) => { const a = all.slice(); a.splice(i + 1, 0, copy); return a; });
    setSelectedId(copy.id);
  };

  const onDragStart = (e: DragEvent, i: number) => { setDragIdx(i); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(i)); };
  const onDrop = (e: DragEvent, i: number) => { e.preventDefault(); if (dragIdx != null) move(dragIdx, i); setDragIdx(null); setOverIdx(null); };

  const handleErr = (e: unknown) => toast({ tone: "error", title: isApiError(e) && e.kind === "forbidden" ? d.errors.forbidden : isApiError(e) && e.kind === "validation" ? Object.values(e.fieldErrors)[0]?.[0] ?? d.form.invalid : d.errors.generic });
  const save = async () => {
    setBusy("save");
    try { const p = await pagesApi.saveSections(Number(id), sections); setPage(p); toast({ tone: "success", title: d.builder.savedSections }); return true; }
    catch (e) { handleErr(e); return false; } finally { setBusy(null); }
  };
  const publish = async () => {
    if (dirty && !(await save())) return;
    setBusy("publish");
    try { setPage(await pagesApi.publish(Number(id))); toast({ tone: "success", title: d.builder.published }); } catch (e) { handleErr(e); } finally { setBusy(null); }
  };
  const schedule = async () => {
    if (dirty && !(await save())) return;
    setBusy("schedule");
    const iso = new Date(publishAt).toISOString();
    try { setPage(await pagesApi.schedule(Number(id), iso)); toast({ tone: "success", title: f(d.builder.scheduled, { date: formatDateTime(iso, locale) }) }); setScheduleOpen(false); }
    catch (e) { handleErr(e); } finally { setBusy(null); }
  };

  const homeModule = useMemo(() => (selected && isHomeBlock(selected.type) ? HOME_BLOCKS.find((b) => `home:${b.type}` === selected.type)?.manage : undefined), [selected]);

  if (!can("pages.view")) return <Forbidden />;
  if (error) return <ErrorState error={error} />;
  if (loading || !page) return <div className="grid gap-4 lg:grid-cols-[280px_1fr_1fr]"><Skeleton className="h-96" /><Skeleton className="h-96" /><Skeleton className="h-96" /></div>;

  return (
    <div className="pb-4">
      {/* Header / actions */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <ButtonLink href={`/${locale}/pages/${id}`} variant="ghost" size="iconSm" icon="back" directional aria-label={d.common.back} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[20px] font-bold">{d.builder.title}: {tl(page.title, locale)}</h1>
          <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <StatusBadge status={page.status} />
            <span className="num" dir="ltr">/{page.slug === "home" ? "" : page.slug}</span>
            {page.status === "scheduled" && page.publishAt && <span>· {formatDateTime(page.publishAt, locale)}</span>}
            {dirty && <span className="font-semibold text-accent">· {d.form.saveBar}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && <Button icon="check" loading={busy === "save"} disabled={!dirty} onClick={() => void save()}>{d.builder.saveSections}</Button>}
          {canPublish && <Button icon="calendar" onClick={() => setScheduleOpen(true)}>{d.builder.schedulePublish}</Button>}
          {canPublish && <Button variant="accent" icon="send2" directional loading={busy === "publish"} onClick={() => void publish()}>{d.builder.publish}</Button>}
        </div>
      </div>

      <div className="mb-3 lg:hidden">
        <Segmented label={d.builder.title} value={mobilePane} onChange={setMobilePane} options={[{ id: "edit", label: d.builder.edit }, { id: "preview", label: d.builder.livePreview }]} />
      </div>
      <p className="sr-only" aria-live="assertive">{announce}</p>

      <div className="grid gap-4 lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)_minmax(0,1fr)]">
        {/* Sections list */}
        <section className={clsx("card flex max-h-[calc(100dvh-180px)] flex-col lg:sticky lg:top-[72px]", mobilePane === "preview" && "hidden lg:flex")} aria-labelledby="sec-h">
          <header className="flex items-center justify-between border-b border-line px-3 py-2.5">
            <h2 id="sec-h" className="text-sm font-bold">{d.builder.sections} <span className="num text-muted">({sections.length})</span></h2>
            {canEdit && <Button size="sm" variant="subtle" icon="plus" onClick={() => setPaletteOpen(true)}>{d.builder.addSection}</Button>}
          </header>
          {sections.length === 0 ? <EmptyState icon="blocks" title={d.builder.empty} className="py-8" /> : (
            <ol ref={listRef} className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-2" aria-label={d.builder.sections}>
              {sections.map((s, i) => (
                <li key={s.id} draggable={canEdit} onDragStart={(e) => onDragStart(e, i)} onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                  onDragOver={(e) => { e.preventDefault(); setOverIdx(i); }} onDrop={(e) => onDrop(e, i)}
                  className={clsx("group rounded-lg border transition-colors", selectedId === s.id ? "border-brand-700 bg-brand-100/60" : "border-transparent hover:bg-raised",
                    dragIdx === i && "opacity-40", overIdx === i && dragIdx != null && dragIdx !== i && "border-dashed border-accent")}>
                  <div className="flex items-center gap-1.5 px-1.5 py-1.5">
                    {canEdit && <span className="cursor-grab text-muted active:cursor-grabbing" title={d.common.drag} aria-hidden="true"><Icon name="grip" className="size-4" /></span>}
                    <button type="button" data-sid={s.id} onClick={() => { setSelectedId(s.id); setMobilePane("edit"); }} aria-current={selectedId === s.id ? "true" : undefined}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded text-start">
                      <span className={clsx("grid size-7 shrink-0 place-items-center rounded-md", isHomeBlock(s.type) ? "bg-accent/15 text-accent" : "bg-brand-100 text-brand-700")}><Icon name={blockIcon(s.type)} className="size-4" /></span>
                      <span className="min-w-0 flex-1">
                        <span className={clsx("block truncate text-sm font-medium", !s.isVisible && "text-muted line-through")}>{blockName(s.type)}</span>
                        <span className="num block text-2xs text-muted">#{i + 1}{(s.startsAt || s.endsAt) ? ` · ${d.builder.scheduledBadge}` : ""}{!s.isVisible ? ` · ${d.builder.hidden}` : ""}</span>
                      </span>
                    </button>
                    {canEdit && (
                      <span className="flex shrink-0">
                        <Button size="iconSm" variant="ghost" icon="sortUp" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label={`${d.common.moveUp}: ${blockName(s.type)}`} />
                        <Button size="iconSm" variant="ghost" icon="sortDown" disabled={i === sections.length - 1} onClick={() => move(i, i + 1)} aria-label={`${d.common.moveDown}: ${blockName(s.type)}`} />
                        <Button size="iconSm" variant="ghost" icon={s.isVisible ? "eye" : "eyeOff"} onClick={() => update(s.id, { isVisible: !s.isVisible })} aria-pressed={!s.isVisible} aria-label={`${s.isVisible ? d.common.hide : d.common.show}: ${blockName(s.type)}`} />
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Editor */}
        <section className={clsx("card min-w-0", mobilePane === "preview" && "hidden lg:block")} aria-labelledby="ed-h">
          {!selected ? <EmptyState icon="edit" title={d.builder.selectBlock} /> : (
            <>
              <header className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
                <span className="grid size-7 place-items-center rounded-md bg-brand-100 text-brand-700"><Icon name={blockIcon(selected.type)} className="size-4" /></span>
                <h2 id="ed-h" className="min-w-0 flex-1 truncate text-sm font-bold">{d.builder.editBlock}: {blockName(selected.type)}</h2>
                {canEdit && <>
                  <Button size="sm" variant="ghost" icon="copy" onClick={() => duplicate(selected)}>{d.common.duplicate}</Button>
                  <Button size="sm" variant="ghost" icon="trash" className="text-danger" onClick={() => setToDelete(selected)}>{d.common.delete}</Button>
                </>}
              </header>
              <div className="space-y-5 p-4">
                {isHomeBlock(selected.type) ? (
                  <div className="rounded-lg border border-accent/40 bg-accent/[.06] p-3 text-sm">
                    <p className="flex gap-2"><Icon name="info" className="mt-0.5 size-4 text-accent" />{f(d.builder.catalogData, { module: homeModule ? (d.nav as Record<string, string>)[homeModule] ?? homeModule : "" })}</p>
                    {homeModule && <ButtonLink href={`/${locale}/${homeModule}`} size="sm" className="mt-2" icon="external">{f(d.builder.manage, { module: (d.nav as Record<string, string>)[homeModule] ?? homeModule })}</ButtonLink>}
                  </div>
                ) : (
                  <>
                    <Tabs label={d.builder.editBlock} size="sm" value={lang} onChange={setLang} tabs={[{ id: "ar", label: <span lang="ar">{d.form.tabs.ar}</span> }, { id: "en", label: <span lang="en">{d.form.tabs.en}</span> }]} />
                    <BlockForm key={`${selected.id}-${lang}`} type={selected.type as BlockType} data={selected.data as Record<string, unknown>} lang={lang} readOnly={!canEdit}
                      onChange={(data) => update(selected.id, { data: data as AdminPageSection["data"] })} />
                  </>
                )}
                <fieldset className="space-y-3 border-t border-line pt-4">
                  <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">{d.builder.schedule}</legend>
                  <Switch checked={selected.isVisible} disabled={!canEdit} onChange={(v) => update(selected.id, { isVisible: v })} label={selected.isVisible ? d.builder.visible : d.builder.hidden} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><label htmlFor="s-from" className="label">{d.builder.startsAt}</label>
                      <input id="s-from" type="datetime-local" dir="ltr" className="field num" disabled={!canEdit} value={selected.startsAt ? toLocalInput(selected.startsAt) : ""} onChange={(e) => update(selected.id, { startsAt: e.target.value ? new Date(e.target.value).toISOString() : null })} /></div>
                    <div><label htmlFor="s-to" className="label">{d.builder.endsAt}</label>
                      <input id="s-to" type="datetime-local" dir="ltr" className="field num" disabled={!canEdit} min={selected.startsAt ? toLocalInput(selected.startsAt) : undefined} value={selected.endsAt ? toLocalInput(selected.endsAt) : ""} onChange={(e) => update(selected.id, { endsAt: e.target.value ? new Date(e.target.value).toISOString() : null })} /></div>
                  </div>
                </fieldset>
              </div>
            </>
          )}
        </section>

        {/* Live preview */}
        <section className={clsx("card min-w-0 lg:col-span-2 2xl:col-span-1 2xl:sticky 2xl:top-[72px] 2xl:max-h-[calc(100dvh-180px)] 2xl:overflow-hidden", mobilePane === "edit" && "hidden lg:block")} aria-labelledby="pv-h">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
            <h2 id="pv-h" className="text-sm font-bold">{d.builder.livePreview}</h2>
            <div className="flex gap-2">
              <Segmented label={d.builder.previewLang} value={previewLang} onChange={setPreviewLang} options={[{ id: "ar", label: "ع" }, { id: "en", label: "EN" }]} />
              <Segmented label={d.builder.livePreview} value={device} onChange={setDevice} className="hidden sm:inline-flex"
                options={[{ id: "desktop", label: <span className="sr-only">{d.builder.desktop}</span>, icon: <Icon name="monitor" className="size-4" /> }, { id: "mobile", label: <span className="sr-only">{d.builder.mobile}</span>, icon: <Icon name="mobile" className="size-4" /> }]} />
            </div>
          </header>
          <div className="scrollbar-thin overflow-y-auto bg-raised p-3 2xl:max-h-[calc(100dvh-230px)]">
            <div lang={previewLang} dir={previewLang === "ar" ? "rtl" : "ltr"} style={{ ["--font-sans" as string]: previewLang === "ar" ? "'IBM Plex Sans Arabic','IBM Plex Sans'" : "'IBM Plex Sans','IBM Plex Sans Arabic'" }}
              className={clsx("mx-auto overflow-hidden rounded-card border border-line bg-bg font-sans shadow-lift transition-[max-width] duration-300", device === "mobile" ? "max-w-[390px]" : "max-w-full")}>
              <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-2.5">
                <svg viewBox="0 0 40 40" className="size-6" aria-hidden="true"><path d="M4 36V20a16 16 0 0 1 32 0v16z" fill="rgb(var(--brand-900))" /><path d="M20 8a12 12 0 0 0-12 12h12z" fill="rgb(var(--accent))" /><path d="M20 8a12 12 0 0 1 12 12H20z" fill="#7FA9D6" /></svg>
                <span className="text-sm font-bold">{previewLang === "ar" ? "بنك وِثاق" : "Withaq Bank"}</span>
                <span className="ms-auto flex gap-2" aria-hidden="true">{[1, 2, 3].map((i) => <span key={i} className="h-1.5 w-8 rounded-full bg-line" />)}</span>
              </div>
              {sections.length === 0 ? <p className="p-8 text-center text-sm text-muted">{d.builder.noPreview}</p>
                : sections.map((s) => <SectionPreview key={s.id} section={s} lang={previewLang} selected={s.id === selectedId} onSelect={() => setSelectedId(s.id)} />)}
            </div>
          </div>
        </section>
      </div>

      {/* Block palette */}
      <Dialog open={paletteOpen} onClose={() => setPaletteOpen(false)} title={d.builder.palette} size="lg">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{d.builder.generic}</h3>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {GENERIC_BLOCKS.map((b) => (
            <li key={b.type}><button type="button" onClick={() => add(b.type)} className="flex w-full items-center gap-2.5 rounded-lg border border-line p-2.5 text-start text-sm hover:border-brand-700 hover:bg-brand-100/40">
              <span className="grid size-8 place-items-center rounded-md bg-brand-100 text-brand-700"><Icon name={b.icon} className="size-4" /></span>{blockName(b.type)}
            </button></li>
          ))}
        </ul>
        {isHome && <>
          <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-muted">{d.builder.homeBlocks}</h3>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {HOME_BLOCKS.map((b) => {
              const key = `home:${b.type}` as SectionType;
              const used = sections.some((s) => s.type === key);
              return (
                <li key={b.type}><button type="button" disabled={used} onClick={() => add(key)} className="flex w-full items-center gap-2.5 rounded-lg border border-line p-2.5 text-start text-sm hover:border-accent hover:bg-accent/5 disabled:opacity-40">
                  <span className="grid size-8 place-items-center rounded-md bg-accent/15 text-accent"><Icon name={b.icon} className="size-4" /></span>{blockName(key)}
                  {used && <Icon name="check" className="ms-auto size-4 text-success" />}
                </button></li>
              );
            })}
          </ul>
        </>}
      </Dialog>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} title={d.builder.deleteSection} confirmLabel={d.common.delete}
        body={toDelete ? f(d.builder.deleteSectionBody, { name: blockName(toDelete.type) }) : ""}
        onConfirm={() => { if (!toDelete) return; const i = sections.findIndex((s) => s.id === toDelete.id); setSections((all) => all.filter((s) => s.id !== toDelete.id)); setSelectedId(sections[i + 1]?.id ?? sections[i - 1]?.id ?? null); setToDelete(null); }} />

      <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} title={d.builder.schedulePublish} size="sm"
        footer={<><Button onClick={() => setScheduleOpen(false)}>{d.common.cancel}</Button><Button variant="primary" icon="calendar" loading={busy === "schedule"} disabled={!publishAt || new Date(publishAt).getTime() <= Date.now()} onClick={() => void schedule()}>{d.builder.schedulePublish}</Button></>}>
        <label htmlFor="pub-at" className="label">{d.builder.publishAt}</label>
        <input id="pub-at" data-autofocus type="datetime-local" dir="ltr" className="field num" value={publishAt} min={toLocalInput(new Date().toISOString())} onChange={(e) => setPublishAt(e.target.value)} />
      </Dialog>
    </div>
  );
}

"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import type { MediaItem } from "@/types/api";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Controls";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { MediaThumb } from "./MediaThumb";
import { Uploader } from "./Uploader";
import { dataUrlToBlobUrl, safeSrc } from "./mediaUtils";
import { useI18n } from "@/components/providers/I18nProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { mediaApi } from "@/lib/api/endpoints";
import { useAsync, useDebounced } from "@/lib/hooks/useAsync";
import { formatBytes, formatDate, formatDateTime, formatNumber, tl } from "@/lib/i18n/config";

type Kind = "all" | MediaItem["kind"];

/**
 * The media library. `mode="manage"` = full screen; `mode="pick"` = picker (select one or many, restricted kinds).
 */
export function MediaBrowser({ mode = "manage", accept, multiple = false, onPick }: {
  mode?: "manage" | "pick"; accept?: MediaItem["kind"][]; multiple?: boolean; onPick?: (items: MediaItem[]) => void;
}) {
  const { d, f, locale } = useI18n();
  const { can } = useAuth();
  const toast = useToast();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [kind, setKind] = useState<Kind>(accept?.length === 1 ? accept[0]! : "all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const [picked, setPicked] = useState<MediaItem[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const q = useDebounced(search, 250);
  const perPage = mode === "pick" ? 18 : 24;

  useEffect(() => { setPage(1); }, [q, kind]);

  const { data, error, loading, reload, setData } = useAsync(
    () => mediaApi.list({ page, perPage, search: q, sort: "-createdAt", ...(kind !== "all" ? { kind } : {}) }), [page, q, kind, perPage]);

  const kinds: Kind[] = ["all", ...((accept ?? ["image", "video", "pdf", "document"]) as MediaItem["kind"][])];
  const kindLabel = (k: Kind) => (k === "all" ? d.common.all : d.media.kinds[k]);

  const togglePick = (m: MediaItem) => {
    if (!multiple) { onPick?.([m]); return; }
    setPicked((p) => (p.some((x) => x.id === m.id) ? p.filter((x) => x.id !== m.id) : [...p, m]));
  };

  const onUploaded = (items: MediaItem[]) => {
    setShowUpload(false);
    if (page === 1 && data) setData({ ...data, data: [...items, ...data.data].slice(0, perPage), meta: { ...data.meta, total: data.meta.total + items.length } });
    else void reload();
  };

  const items = data?.data ?? [];
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-56">
          <Icon name="search" className="pointer-events-none absolute inset-y-0 start-2.5 my-auto size-4 text-muted" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={d.common.searchPlaceholder} aria-label={d.common.search} className="field ps-8" />
        </div>
        <div className="scrollbar-thin max-w-full overflow-x-auto">
          <Segmented label={d.media.type} value={kind} onChange={setKind} options={kinds.map((k) => ({ id: k, label: kindLabel(k) }))} />
        </div>
        {mode === "manage" && <Segmented label={d.common.view} value={view} onChange={setView}
          options={[{ id: "grid", label: <span className="sr-only">{d.common.grid}</span>, icon: <Icon name="grid" className="size-4" /> }, { id: "list", label: <span className="sr-only">{d.common.list}</span>, icon: <Icon name="list" className="size-4" /> }]} />}
        {can("media.create") && <Button variant={mode === "manage" ? "primary" : "secondary"} icon="upload" onClick={() => setShowUpload((s) => !s)} aria-expanded={showUpload}>{d.media.upload}</Button>}
      </div>

      {showUpload && <div className="mb-4"><Uploader onUploaded={onUploaded} compact={mode === "pick"} /></div>}

      {error ? <ErrorState error={error} onRetry={reload} /> : loading && !data ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }, (_, i) => <Skeleton key={i} className="aspect-[4/3] w-full rounded-card" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="card"><EmptyState icon="image" title={q || kind !== "all" ? d.list.emptyFiltered : d.media.empty} body={q ? undefined : d.media.emptyBody} /></div>
      ) : view === "grid" || mode === "pick" ? (
        <ul className={clsx("grid gap-3", mode === "pick" ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6", loading && "opacity-60")}>
          {items.map((m) => {
            const isPicked = picked.some((x) => x.id === m.id);
            return (
              <li key={m.id}>
                <button type="button" onClick={() => (mode === "pick" ? togglePick(m) : setPreview(m))} aria-pressed={mode === "pick" && multiple ? isPicked : undefined}
                  className={clsx("group block w-full overflow-hidden rounded-card border bg-surface text-start transition hover:-translate-y-0.5 hover:shadow-lift",
                    isPicked ? "border-brand-700 ring-2 ring-brand-700/30" : "border-line")}>
                  <span className="relative block aspect-[4/3]">
                    <MediaThumb media={m} className="absolute inset-0 size-full" rounded="rounded-none" />
                    {isPicked && <span className="absolute end-2 top-2 grid size-6 place-items-center rounded-full bg-brand-700 text-white"><Icon name="check" className="size-4" /></span>}
                    <span className="absolute bottom-1.5 start-1.5 rounded bg-brand-900/75 px-1.5 text-2xs font-semibold uppercase leading-5 text-white">{m.kind}</span>
                  </span>
                  <span className="block px-2 py-1.5">
                    <span className="block truncate text-xs font-medium" dir="ltr">{m.filename}</span>
                    <span className="num block text-2xs text-muted">{formatBytes(m.size, locale)}{m.width ? ` · ${m.width}×${m.height}` : ""}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-raised text-xs text-muted"><tr>
              <th scope="col" className="px-3 py-2 text-start font-semibold">{d.media.filename}</th>
              <th scope="col" className="hidden px-3 py-2 text-start font-semibold md:table-cell">{d.media.type}</th>
              <th scope="col" className="px-3 py-2 text-end font-semibold">{d.media.size}</th>
              <th scope="col" className="hidden px-3 py-2 text-start font-semibold lg:table-cell">{d.media.uploader}</th>
              <th scope="col" className="hidden px-3 py-2 text-start font-semibold sm:table-cell">{d.media.date}</th>
            </tr></thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id} className="border-t border-line hover:bg-raised">
                  <td className="px-3 py-1.5">
                    <button type="button" onClick={() => setPreview(m)} className="flex min-w-0 items-center gap-2.5 text-start hover:text-brand-700">
                      <MediaThumb media={m} className="size-9 shrink-0" />
                      <span className="min-w-0"><span className="block truncate font-medium" dir="ltr">{m.filename}</span><span className="block truncate text-xs text-muted">{tl(m.alt, locale)}</span></span>
                    </button>
                  </td>
                  <td className="hidden px-3 py-1.5 text-xs text-muted md:table-cell" dir="ltr">{m.mime}</td>
                  <td className="num px-3 py-1.5 text-end text-xs">{formatBytes(m.size, locale)}</td>
                  <td className="hidden px-3 py-1.5 text-xs lg:table-cell">{m.uploader?.name ?? "—"}</td>
                  <td className="hidden px-3 py-1.5 text-xs text-muted sm:table-cell">{formatDate(m.createdAt, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.meta.lastPage > 1 && (
        <div className="mt-3 flex items-center justify-between gap-2 text-sm">
          <span className="num text-muted">{f(d.list.showing, { from: (data.meta.currentPage - 1) * data.meta.perPage + 1, to: Math.min(data.meta.total, data.meta.currentPage * data.meta.perPage), total: formatNumber(data.meta.total, locale) })}</span>
          <div className="flex gap-1">
            <Button size="sm" icon="chevronSide" directional className="[&_svg]:rotate-180" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label={d.list.prev} />
            <Button size="sm" icon="chevronSide" directional disabled={page >= data.meta.lastPage} onClick={() => setPage((p) => p + 1)} aria-label={d.list.next} />
          </div>
        </div>
      )}

      {mode === "pick" && multiple && (
        <div className="sticky bottom-0 mt-4 flex justify-end gap-2 border-t border-line bg-surface pt-3">
          <Button variant="primary" icon="check" disabled={!picked.length} onClick={() => onPick?.(picked)}>{f(d.media.pickMany, { count: picked.length })}</Button>
        </div>
      )}

      {preview && <MediaDetails item={preview} onClose={() => setPreview(null)}
        onChange={(m) => { setPreview(m); if (data) setData({ ...data, data: data.data.map((x) => (x.id === m.id ? m : x)) }); }}
        onDeleted={(id) => { setPreview(null); if (data) setData({ ...data, data: data.data.filter((x) => x.id !== id), meta: { ...data.meta, total: data.meta.total - 1 } }); toast({ tone: "success", title: d.list.deleted }); }} />}
    </div>
  );
}

/** Preview (image/video/pdf) + details + editable alt + copy URL + delete. */
function MediaDetails({ item, onClose, onChange, onDeleted }: { item: MediaItem; onClose: () => void; onChange: (m: MediaItem) => void; onDeleted: (id: number) => void }) {
  const { d, f, locale } = useI18n();
  const { can } = useAuth();
  const toast = useToast();
  const [alt, setAlt] = useState(item.alt);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const src = safeSrc(item.url);
  const dirty = alt.ar !== item.alt.ar || alt.en !== item.alt.en;
  const [pdfSrc, setPdfSrc] = useState("");
  useEffect(() => {
    if (item.kind !== "pdf" || !src) { setPdfSrc(""); return; }
    const url = src.startsWith("data:application/pdf") ? dataUrlToBlobUrl(src) : src;
    setPdfSrc(url);
    return () => { if (url.startsWith("blob:")) URL.revokeObjectURL(url); };
  }, [item.kind, src]);

  const save = async () => {
    setSaving(true);
    try { onChange(await mediaApi.update(item.id, { alt })); toast({ tone: "success", title: d.media.altSaved }); }
    catch { toast({ tone: "error", title: d.errors.generic }); } finally { setSaving(false); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(item.url.startsWith("data:") ? `${location.origin}/media/${item.id}/${item.filename}` : item.url); toast({ tone: "success", title: d.media.urlCopied }); }
    catch { toast({ tone: "error", title: d.errors.generic }); }
  };
  const remove = async () => {
    setDeleting(true);
    try { await mediaApi.remove(item.id); onDeleted(item.id); } catch { toast({ tone: "error", title: d.errors.generic }); } finally { setDeleting(false); setConfirm(false); }
  };

  return (
    <Dialog open onClose={onClose} size="xl" title={<span dir="ltr">{item.filename}</span>} description={d.media.details}
      footer={<>
        {can("media.delete") && <Button variant="ghost" className="me-auto text-danger" icon="trash" onClick={() => setConfirm(true)}>{d.common.delete}</Button>}
        <Button icon="copy" onClick={copy}>{d.media.copyUrl}</Button>
        {can("media.update") && <Button variant="primary" loading={saving} disabled={!dirty} onClick={save}>{d.common.save}</Button>}
      </>}>
      <div className="grid gap-5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="grid min-h-56 place-items-center overflow-hidden rounded-card border border-line bg-raised">
          {item.kind === "image" && src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={tl(item.alt, locale)} className="max-h-[60vh] w-auto object-contain" />
          ) : item.kind === "video" && src && !src.startsWith("data:image") ? (
            <video src={src} controls className="max-h-[60vh] w-full" />
          ) : pdfSrc ? (
            <iframe src={pdfSrc} title={item.filename} className="h-[60vh] w-full bg-white" referrerPolicy="no-referrer" />
          ) : (
            <div className="p-6 text-center"><MediaThumb media={item} className="mx-auto h-40 w-60" /><p className="mt-2 text-xs text-muted">{d.media.noPreview}</p></div>
          )}
        </div>
        <div className="space-y-4">
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted">{d.media.type}</dt><dd className="truncate" dir="ltr">{item.mime}</dd>
            <dt className="text-muted">{d.media.size}</dt><dd className="num">{formatBytes(item.size, locale)}</dd>
            {item.width && <><dt className="text-muted">{d.media.dimensions}</dt><dd className="num">{item.width} × {item.height}</dd></>}
            <dt className="text-muted">{d.media.uploader}</dt><dd>{item.uploader?.name ?? "—"}</dd>
            <dt className="text-muted">{d.media.date}</dt><dd>{formatDateTime(item.createdAt, locale)}</dd>
          </dl>
          <div className="space-y-3 border-t border-line pt-3">
            <div>
              <label htmlFor="alt-ar" className="label">{d.media.altAr}</label>
              <input id="alt-ar" dir="rtl" className="field" value={alt.ar} disabled={!can("media.update")} onChange={(e) => setAlt({ ...alt, ar: e.target.value })} />
            </div>
            <div>
              <label htmlFor="alt-en" className="label">{d.media.altEn}</label>
              <input id="alt-en" dir="ltr" className="field" value={alt.en} disabled={!can("media.update")} onChange={(e) => setAlt({ ...alt, en: e.target.value })} />
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={remove} loading={deleting} title={d.media.deleteTitle}
        body={f(d.media.deleteBody, { name: item.filename })} confirmLabel={d.common.delete} />
    </Dialog>
  );
}

export function MediaPickerDialog({ open, onClose, onPick, accept, multiple }: {
  open: boolean; onClose: () => void; onPick: (items: MediaItem[]) => void; accept?: MediaItem["kind"][]; multiple?: boolean;
}) {
  const { d } = useI18n();
  return (
    <Dialog open={open} onClose={onClose} size="full" title={d.media.pickTitle}>
      {open && <MediaBrowser mode="pick" accept={accept} multiple={multiple} onPick={(items) => { onPick(items); onClose(); }} />}
    </Dialog>
  );
}

"use client";

import clsx from "clsx";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { IconName, Localized, MediaItem, MediaRef, MenuItem, Seo } from "@/types/api";
import { Icon, ICON_NAMES } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Checkbox, Switch } from "@/components/ui/Controls";
import { Dialog } from "@/components/ui/Dialog";
import { MediaPickerDialog } from "@/components/media/MediaBrowser";
import { MediaThumb } from "@/components/media/MediaThumb";
import { toRef } from "@/components/media/mediaUtils";
import { useI18n } from "@/components/providers/I18nProvider";
import { CharCounter, FieldShell } from "./Field";
import { tl } from "@/lib/i18n/config";
import { PERMISSION_RESOURCES, RESOURCE_ABILITIES, ABILITIES, type PermissionResource } from "@/lib/rbac";

/* ───────── list of strings (one language) ───────── */
export function StringList({ value, onChange, dir, label, readOnly, id }: { value: string[]; onChange: (v: string[]) => void; dir: "rtl" | "ltr"; label: string; readOnly?: boolean; id?: string }) {
  const { d } = useI18n();
  const [draft, setDraft] = useState("");
  const add = () => { const v = draft.trim(); if (!v) return; onChange([...value, v]); setDraft(""); };
  const move = (i: number, delta: number) => { const a = value.slice(); const [x] = a.splice(i, 1); a.splice(i + delta, 0, x!); onChange(a); };
  return (
    <div className="space-y-1.5">
      {value.length > 0 && (
        <ol className="space-y-1">
          {value.map((v, i) => (
            <li key={`${i}-${v}`} className="flex items-center gap-1">
              <span className="num w-5 text-center text-2xs text-muted">{i + 1}</span>
              <input dir={dir} className="field h-8 min-h-8 flex-1 py-1" value={v} readOnly={readOnly} aria-label={`${label} ${i + 1}`}
                onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))} />
              {!readOnly && <>
                <Button size="iconSm" variant="ghost" icon="sortUp" disabled={i === 0} onClick={() => move(i, -1)} aria-label={d.common.moveUp} />
                <Button size="iconSm" variant="ghost" icon="sortDown" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label={d.common.moveDown} />
                <Button size="iconSm" variant="ghost" icon="trash" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`${d.common.remove} ${v}`} className="hover:text-danger" />
              </>}
            </li>
          ))}
        </ol>
      )}
      {!readOnly && (
        <div className="flex gap-1.5">
          <input id={id} dir={dir} className="field h-8 min-h-8 flex-1 py-1" value={draft} placeholder={d.form.listItemPlaceholder} aria-label={label}
            onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
          <Button size="sm" icon="plus" onClick={add} disabled={!draft.trim()}>{d.common.add}</Button>
        </div>
      )}
    </div>
  );
}

/* ───────── media picker field ───────── */
export function MediaField({ value, onChange, accept, label, readOnly, invalid, id }: {
  value: MediaRef | null; onChange: (v: MediaRef | null) => void; accept?: MediaItem["kind"][]; label: string; readOnly?: boolean; invalid?: boolean; id?: string;
}) {
  const { d, locale } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div className={clsx("flex items-center gap-3 rounded-lg border bg-surface p-2", invalid ? "border-danger" : "border-line")}>
      <MediaThumb media={value} className="h-14 w-20 shrink-0" />
      <div className="min-w-0 flex-1">
        {value ? <>
          <p className="truncate text-sm font-medium">{tl(value.alt, locale) || `#${value.id}`}</p>
          <p className="num truncate text-xs text-muted" dir="ltr">{value.mime}{value.width ? ` · ${value.width}×${value.height}` : ""}</p>
        </> : <p className="text-sm text-muted">{d.form.noMedia}</p>}
      </div>
      {!readOnly && <div className="flex gap-1">
        <Button id={id} size="sm" icon="image" onClick={() => setOpen(true)} aria-label={`${value ? d.form.replaceMedia : d.form.pickMedia} — ${label}`}>{value ? d.form.replaceMedia : d.form.pickMedia}</Button>
        {value && <Button size="iconSm" variant="ghost" icon="close" onClick={() => onChange(null)} aria-label={`${d.common.remove} — ${label}`} />}
      </div>}
      <MediaPickerDialog open={open} onClose={() => setOpen(false)} accept={accept} onPick={(items) => items[0] && onChange(toRef(items[0]))} />
    </div>
  );
}

export function MediaListField({ value, onChange, label, readOnly }: { value: MediaRef[]; onChange: (v: MediaRef[]) => void; label: string; readOnly?: boolean }) {
  const { d } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((m, i) => (
          <li key={`${m.id}-${i}`} className="group relative">
            <MediaThumb media={m} className="aspect-[4/3] w-full" />
            {!readOnly && <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`${d.common.remove} ${i + 1}`}
              className="absolute end-1 top-1 grid size-6 place-items-center rounded-full bg-brand-900/80 text-white opacity-90 hover:bg-danger"><Icon name="close" className="size-3.5" /></button>}
          </li>
        ))}
        {!readOnly && <li><button type="button" onClick={() => setOpen(true)} aria-label={`${d.common.add} — ${label}`}
          className="grid aspect-[4/3] w-full place-items-center rounded-md border-2 border-dashed border-line text-muted hover:border-brand-700 hover:text-brand-700"><Icon name="plus" /></button></li>}
      </ul>
      <MediaPickerDialog open={open} onClose={() => setOpen(false)} accept={["image"]} multiple onPick={(items) => onChange([...value, ...items.map(toRef)])} />
    </div>
  );
}

/* ───────── icon picker ───────── */
export function IconField({ value, onChange, readOnly, id, label }: { value: IconName | null | undefined; onChange: (v: IconName) => void; readOnly?: boolean; id?: string; label: string }) {
  const { d } = useI18n();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const list = ICON_NAMES.filter((n) => n.includes(q.toLowerCase().trim()));
  return (
    <>
      <button id={id} type="button" disabled={readOnly} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={`${d.form.pickIcon} — ${label}: ${value ?? ""}`}
        className="field flex items-center gap-2 text-start">
        <span className="grid size-7 place-items-center rounded-md bg-brand-100 text-brand-700">{value ? <Icon name={value} className="size-4" /> : <Icon name="plus" className="size-4" />}</span>
        <span className="num flex-1 truncate text-sm" dir="ltr">{value ?? d.form.pickIcon}</span>
        <Icon name="chevron" className="size-4 text-muted" />
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={d.form.pickIcon} size="md">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={d.form.searchIcons} aria-label={d.form.searchIcons} className="field mb-3" data-autofocus dir="ltr" />
        <ul role="listbox" aria-label={d.form.pickIcon} className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {list.map((n) => (
            <li key={n} role="option" aria-selected={value === n}>
              <button type="button" onClick={() => { onChange(n); setOpen(false); }}
                className={clsx("flex w-full flex-col items-center gap-1.5 rounded-lg border p-3 text-2xs transition hover:border-brand-700",
                  value === n ? "border-brand-700 bg-brand-100 text-brand-700" : "border-line")}>
                <Icon name={n} className="size-6" /><span className="num" dir="ltr">{n}</span>
              </button>
            </li>
          ))}
        </ul>
      </Dialog>
    </>
  );
}

/* ───────── lat/lng ───────── */
export function LatLngField({ lat, lng, onChange, readOnly, errors }: { lat: number | null; lng: number | null; onChange: (lat: number | null, lng: number | null) => void; readOnly?: boolean; errors?: { lat?: string; lng?: string } }) {
  const { d } = useI18n();
  const num = (v: string) => (v.trim() === "" ? null : Number(v));
  const valid = lat != null && lng != null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  // Yemen bounding box for the mini map.
  const box = { minLat: 12, maxLat: 19, minLng: 42, maxLng: 54 };
  const px = valid ? ((lng! - box.minLng) / (box.maxLng - box.minLng)) * 100 : 50;
  const py = valid ? (1 - (lat! - box.minLat) / (box.maxLat - box.minLat)) * 100 : 50;
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <div>
        <label className="text-xs text-muted" htmlFor="lat-in">{d.form.lat}</label>
        <input id="lat-in" type="number" step="0.000001" min={-90} max={90} dir="ltr" className="field num" readOnly={readOnly} value={lat ?? ""} aria-invalid={errors?.lat ? true : undefined}
          onChange={(e) => onChange(num(e.target.value), lng)} />
        {errors?.lat && <p className="error-text">{errors.lat}</p>}
      </div>
      <div>
        <label className="text-xs text-muted" htmlFor="lng-in">{d.form.lng}</label>
        <input id="lng-in" type="number" step="0.000001" min={-180} max={180} dir="ltr" className="field num" readOnly={readOnly} value={lng ?? ""} aria-invalid={errors?.lng ? true : undefined}
          onChange={(e) => onChange(lat, num(e.target.value))} />
        {errors?.lng && <p className="error-text">{errors.lng}</p>}
      </div>
      <div className="relative h-20 w-full overflow-hidden rounded-lg border border-line bg-brand-100 sm:w-32" aria-hidden="true">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full text-brand-700/25">
          <path d="M8 40 L30 22 L58 18 L92 30 L96 62 L70 78 L40 92 L18 80 Z" fill="currentColor" />
        </svg>
        {valid && <span className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent shadow" style={{ left: `${Math.min(100, Math.max(0, px))}%`, top: `${Math.min(100, Math.max(0, py))}%` }} />}
      </div>
      <p className="hint sm:col-span-3">{d.form.mapHint}{valid && <> · <a className="text-brand-700 underline" href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`} target="_blank" rel="noopener noreferrer">{d.form.openMap}</a></>}</p>
    </div>
  );
}

/* ───────── multi-select (chips) ───────── */
export function MultiSelect({ value, onChange, options, readOnly, label }: { value: string[]; onChange: (v: string[]) => void; options: { value: string; label: Localized }[]; readOnly?: boolean; label: string }) {
  const { locale } = useI18n();
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button key={o.value} type="button" disabled={readOnly} aria-pressed={on} onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
            className={clsx("inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors",
              on ? "border-brand-700 bg-brand-100 text-brand-700" : "border-line bg-surface text-ink/80 hover:border-muted/60")}>
            {on && <Icon name="check" className="size-3.5" />}{tl(o.label, locale)}
          </button>
        );
      })}
    </div>
  );
}

/* ───────── SEO group with Google snippet preview ───────── */
export function SeoField({ value, onChange, path, readOnly }: { value: Seo; onChange: (v: Seo) => void; path: string; readOnly?: boolean }) {
  const { d, locale } = useI18n();
  const [lang, setLang] = useState<"ar" | "en">(locale);
  const set = <K extends keyof Seo>(k: K, v: Seo[K]) => onChange({ ...value, [k]: v });
  const setL = (k: "title" | "description" | "keywords", l: "ar" | "en", v: string) => onChange({ ...value, [k]: { ...(value[k] ?? { ar: "", en: "" }), [l]: v } });
  const dirL = lang === "ar" ? "rtl" : "ltr";
  const site = "www.withaq-bank.example";
  const url = `${site} › ${lang}${path === "/" ? "" : path.replace(/\//g, " › ")}`;
  const title = value.title[lang] || (lang === "ar" ? "عنوان الصفحة" : "Page title");
  const desc = value.description[lang] || (lang === "ar" ? "اكتب وصفاً موجزاً وجذاباً للصفحة يظهر في نتائج البحث." : "Write a short, compelling description that appears in search results.");
  const trunc = (s: string, n: number) => ([...s].length > n ? `${[...s].slice(0, n - 1).join("")}…` : s);

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label={d.form.snippet} className="inline-flex rounded-lg border border-line bg-raised p-0.5">
        {(["ar", "en"] as const).map((l) => (
          <button key={l} type="button" role="tab" aria-selected={lang === l} onClick={() => setLang(l)}
            className={clsx("h-7 rounded-md px-3 text-sm font-semibold", lang === l ? "bg-surface shadow-sm" : "text-muted")}>{l === "ar" ? d.common.arabic : d.common.english}</button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <FieldShell label={d.form.seoTitle} counter={<CharCounter value={value.title[lang]} max={60} />}>
            {({ id }) => <input id={id} dir={dirL} className="field" readOnly={readOnly} value={value.title[lang]} onChange={(e) => setL("title", lang, e.target.value)} />}
          </FieldShell>
          <FieldShell label={d.form.seoDescription} counter={<CharCounter value={value.description[lang]} max={160} />}>
            {({ id }) => <textarea id={id} dir={dirL} rows={3} className="field resize-y" readOnly={readOnly} value={value.description[lang]} onChange={(e) => setL("description", lang, e.target.value)} />}
          </FieldShell>
          <FieldShell label={d.form.seoKeywords} help={lang === "ar" ? "افصل بفاصلة" : "Comma separated"}>
            {({ id, describedBy }) => <input id={id} aria-describedby={describedBy} dir={dirL} className="field" readOnly={readOnly} value={value.keywords?.[lang] ?? ""} onChange={(e) => setL("keywords", lang, e.target.value)} />}
          </FieldShell>
        </div>
        <div>
          <p className="mb-1 text-sm font-medium">{d.form.snippet}</p>
          <div dir={dirL} lang={lang} className="rounded-card border border-line bg-white p-4 text-start dark:bg-[#202124]" aria-label={d.form.snippet}>
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-full bg-[#f1f3f4] dark:bg-[#303134]"><svg viewBox="0 0 40 40" className="size-4"><path d="M4 36V20a16 16 0 0 1 32 0v16z" fill="#0C3A36" /></svg></span>
              <span className="min-w-0"><span className="block text-[13px] text-[#202124] dark:text-[#dadce0]">{lang === "ar" ? "بنك وِثاق" : "Withaq Bank"}</span><span dir="ltr" className="block truncate text-[12px] text-[#4d5156] dark:text-[#bdc1c6]">{url}</span></span>
            </div>
            <p className="mt-1.5 text-[19px] leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">{trunc(title, 62)}</p>
            <p className="mt-1 text-[13.5px] leading-normal text-[#4d5156] dark:text-[#bdc1c6]">{trunc(desc, 160)}</p>
            {value.noindex && <p className="mt-2 text-xs font-semibold text-warning">noindex</p>}
          </div>
        </div>
      </div>
      <div className="grid gap-4 border-t border-line pt-4 md:grid-cols-2">
        <FieldShell label={d.form.canonical} help="https://…">
          {({ id, describedBy }) => <input id={id} aria-describedby={describedBy} type="url" dir="ltr" className="field" readOnly={readOnly} value={value.canonical ?? ""} onChange={(e) => set("canonical", e.target.value || null)} />}
        </FieldShell>
        <div className="flex items-end pb-1.5"><Switch checked={!!value.noindex} disabled={readOnly} onChange={(v) => set("noindex", v)} label={d.form.noindex} /></div>
        <FieldShell label={d.form.ogImage} className="md:col-span-2">
          {({ id }) => <MediaField id={id} label={d.form.ogImage} value={value.ogImage ?? null} accept={["image"]} readOnly={readOnly} onChange={(m) => set("ogImage", m)} />}
        </FieldShell>
      </div>
    </div>
  );
}

/* ───────── menu tree editor ───────── */
let tmpId = -1;
type MenuCtx = { value: MenuItem[]; onChange: (v: MenuItem[]) => void; readOnly?: boolean; update: (path: number[], fn: (items: MenuItem[], i: number) => void) => void };

function MenuRow({ item, path, siblings, ctx }: { item: MenuItem; path: number[]; siblings: number; ctx: MenuCtx }) {
  const { d } = useI18n();
  const { update, readOnly, value, onChange } = ctx;
  const i = path[path.length - 1]!;
  const depth = path.length - 1;
  return (
    <li>
      <div className={clsx("flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-surface p-2", depth > 0 && "border-dashed")}>
        <Icon name="grip" className="size-4 text-muted" />
        <input dir="rtl" className="field h-8 min-h-8 w-36 flex-1 py-1" placeholder={d.common.arabic} aria-label={`${d.form.label} (${d.common.arabic})`} readOnly={readOnly} value={item.label.ar}
          onChange={(e) => update(path, (l, j) => { l[j]!.label.ar = e.target.value; })} />
        <input dir="ltr" className="field h-8 min-h-8 w-36 flex-1 py-1" placeholder="English" aria-label={`${d.form.label} (English)`} readOnly={readOnly} value={item.label.en}
          onChange={(e) => update(path, (l, j) => { l[j]!.label.en = e.target.value; })} />
        <input dir="ltr" className="field num h-8 min-h-8 w-32 flex-1 py-1 text-xs" placeholder="/path" aria-label={d.form.href} readOnly={readOnly} value={item.href}
          onChange={(e) => update(path, (l, j) => { l[j]!.href = e.target.value; })} />
        {!readOnly && <span className="flex">
          <Button size="iconSm" variant="ghost" icon="sortUp" disabled={i === 0} aria-label={d.common.moveUp} onClick={() => update(path, (l, j) => { const [x] = l.splice(j, 1); l.splice(j - 1, 0, x!); })} />
          <Button size="iconSm" variant="ghost" icon="sortDown" disabled={i === siblings - 1} aria-label={d.common.moveDown} onClick={() => update(path, (l, j) => { const [x] = l.splice(j, 1); l.splice(j + 1, 0, x!); })} />
          {depth === 0 && i > 0 && <Button size="iconSm" variant="ghost" icon="indent" directional aria-label={d.form.indent} onClick={() => update(path, (l, j) => { const [x] = l.splice(j, 1); (l[j - 1]!.children ??= []).push(x!); })} />}
          {depth > 0 && <Button size="iconSm" variant="ghost" icon="outdent" directional aria-label={d.form.outdent} onClick={() => {
            const next = structuredClone(value); const parent = next[path[0]!]!; const [x] = parent.children!.splice(i, 1); next.splice(path[0]! + 1, 0, x!); onChange(next);
          }} />}
          {depth === 0 && <Button size="iconSm" variant="ghost" icon="plus" aria-label={d.form.addChild} onClick={() => update(path, (l, j) => { (l[j]!.children ??= []).push({ id: tmpId--, label: { ar: "", en: "" }, href: "/" }); })} />}
          <Button size="iconSm" variant="ghost" icon="trash" className="hover:text-danger" aria-label={d.common.delete} onClick={() => update(path, (l, j) => { l.splice(j, 1); })} />
        </span>}
      </div>
      {item.children && item.children.length > 0 && (
        <ul className="ms-3 mt-1.5 space-y-1.5 border-s-2 border-line ps-4">
          {item.children.map((c, ci) => <MenuRow key={c.id} item={c} path={[...path, ci]} siblings={item.children!.length} ctx={ctx} />)}
        </ul>
      )}
    </li>
  );
}

export function MenuTree({ value, onChange, readOnly }: { value: MenuItem[]; onChange: (v: MenuItem[]) => void; readOnly?: boolean }) {
  const { d } = useI18n();
  const update = (path: number[], fn: (items: MenuItem[], i: number) => void) => {
    const next = structuredClone(value);
    let list = next; for (const i of path.slice(0, -1)) list = (list[i]!.children ??= []);
    fn(list, path[path.length - 1]!);
    onChange(next);
  };
  const ctx: MenuCtx = { value, onChange, readOnly, update };
  return (
    <div>
      <ul className="space-y-1.5" aria-label={d.form.menuItem}>
        {value.map((it, i) => <MenuRow key={it.id} item={it} path={[i]} siblings={value.length} ctx={ctx} />)}
      </ul>
      {!readOnly && <Button size="sm" icon="plus" className="mt-2" onClick={() => onChange([...value, { id: tmpId--, label: { ar: "", en: "" }, href: "/" }])}>{d.form.addItem}</Button>}
    </div>
  );
}

/* ───────── permission matrix (resources × abilities) ───────── */
const GROUPS: Record<string, PermissionResource[]> = {
  overview: ["dashboard"],
  content: ["pages", "news", "news-categories", "banners", "faqs", "menus", "seo", "media"],
  catalog: ["services", "products", "financing-products", "cards", "offers"],
  network: ["branches", "atms", "agents"],
  requests: ["applications", "contact-requests", "complaints", "jobs", "job-applications"],
  admin: ["users", "roles", "settings", "audit-logs"],
};

export function PermissionMatrix({ value, onChange, readOnly }: { value: string[]; onChange: (v: string[]) => void; readOnly?: boolean }) {
  const { d, f } = useI18n();
  const set = useMemo(() => new Set(value), [value]);
  const nav = d.nav as Record<string, string>;
  const ab = d.abilities as Record<string, string>;
  const toggle = (perms: string[], on: boolean) => { const s = new Set(value); perms.forEach((p) => (on ? s.add(p) : s.delete(p))); onChange([...s]); };
  const rowPerms = (r: PermissionResource) => RESOURCE_ABILITIES[r].map((a) => `${r}.${a}`);
  const colPerms = (a: string) => PERMISSION_RESOURCES.filter((r) => (RESOURCE_ABILITIES[r] as readonly string[]).includes(a)).map((r) => `${r}.${a}`);
  const state = (perms: string[]) => { const n = perms.filter((p) => set.has(p)).length; return { all: n === perms.length && n > 0, some: n > 0 && n < perms.length }; };
  const label = (r: string) => nav[r] ?? (r === "seo" ? "SEO" : r);

  return (
    <div>
      <p className="mb-2 text-xs text-muted">{f(d.matrix.count, { count: value.length })} · {d.matrix.superNote}</p>
      <div className="scrollbar-thin overflow-x-auto rounded-card border border-line">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="sticky top-0 bg-raised">
            <tr>
              <th scope="col" className="px-3 py-2 text-start text-xs font-semibold text-muted">{d.matrix.resource}</th>
              {ABILITIES.map((a) => {
                const st = state(colPerms(a));
                return (
                  <th key={a} scope="col" className="px-2 py-2 text-center text-xs font-semibold">
                    <div className="flex flex-col items-center gap-1">
                      <span>{ab[a]}</span>
                      <Checkbox checked={st.all} indeterminate={st.some} disabled={readOnly} onChange={(on) => toggle(colPerms(a), on)} ariaLabel={f(d.matrix.colAll, { ability: ab[a] ?? a })} />
                    </div>
                  </th>
                );
              })}
              <th scope="col" className="px-2 py-2 text-center text-xs font-semibold text-muted">{d.common.all}</th>
            </tr>
          </thead>
          {Object.entries(GROUPS).map(([g, resources]) => (
            <tbody key={g}>
              <tr><th colSpan={ABILITIES.length + 2} scope="colgroup" className="bg-brand-100/50 px-3 py-1 text-start text-2xs font-bold uppercase tracking-wide text-brand-700">{(d.matrix.groups as Record<string, string>)[g]}</th></tr>
              {resources.map((r) => {
                const st = state(rowPerms(r));
                return (
                  <tr key={r} className="border-t border-line hover:bg-raised">
                    <th scope="row" className="px-3 py-1.5 text-start font-medium">{label(r)}</th>
                    {ABILITIES.map((a) => {
                      const p = `${r}.${a}`;
                      const allowed = (RESOURCE_ABILITIES[r] as readonly string[]).includes(a);
                      return (
                        <td key={a} className="px-2 py-1.5 text-center">
                          {allowed ? <Checkbox checked={set.has(p)} disabled={readOnly} onChange={(on) => toggle([p], on)} ariaLabel={`${label(r)} — ${ab[a]}`} />
                            : <span className="text-line" aria-hidden="true">—</span>}
                        </td>
                      );
                    })}
                    <td className="px-2 py-1.5 text-center">
                      <Checkbox checked={st.all} indeterminate={st.some} disabled={readOnly} onChange={(on) => toggle(rowPerms(r), on)} ariaLabel={f(d.matrix.rowAll, { resource: label(r) })} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}

/* ───────── helpers ───────── */
export function useFocusFirstError(errors: Record<string, string>, trigger: number) {
  const done = useRef(0);
  useEffect(() => {
    if (!trigger || done.current === trigger) return;
    done.current = trigger;
    requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
  }, [errors, trigger]);
}

export const onEnterBlur = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); };

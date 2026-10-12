"use client";

import type { BlockDataMap, BlockType, IconName, LinkCta, Localized, MediaRef } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { FieldShell } from "@/components/forms/Field";
import { RichText } from "@/components/forms/RichText";
import { IconField, MediaField, MediaListField } from "@/components/forms/inputs";
import { useI18n } from "@/components/providers/I18nProvider";
import { CITY_OPTIONS } from "@/resources/shared";
import { tl } from "@/lib/i18n/config";

type Lang = "ar" | "en";
type AnyData = Record<string, unknown>;


type Ctx = { data: AnyData; set: (k: string, v: unknown) => void; lang: Lang; dir: "rtl" | "ltr"; readOnly?: boolean };

function LText({ c, k, label, area, obj, onObj }: { c: Ctx; k: string; label: string; area?: boolean; obj?: AnyData; onObj?: (v: Localized) => void }) {
  const { lang, dir, readOnly } = c;
  const source = obj ?? c.data;
  const emit = onObj ?? ((v: Localized) => c.set(k, v));
  const v = (source[k] as Localized | null) ?? { ar: "", en: "" };
  return (
    <FieldShell label={<>{label}<span className="ms-1.5 rounded bg-line/60 px-1 text-2xs font-semibold uppercase text-muted">{lang}</span></>}>
      {({ id }) => area
        ? <textarea id={id} dir={dir} rows={3} readOnly={readOnly} className="field" value={v[lang] ?? ""} onChange={(e) => emit({ ...v, [lang]: e.target.value })} />
        : <input id={id} dir={dir} readOnly={readOnly} className="field" value={v[lang] ?? ""} onChange={(e) => emit({ ...v, [lang]: e.target.value })} />}
    </FieldShell>
  );
}

function Cta({ c, k, label, optional }: { c: Ctx; k: string; label: string; optional?: boolean }) {
  const { d } = useI18n();
  const { data, set, lang, dir, readOnly } = c;
  const v = data[k] as LinkCta | null | undefined;
  if (!v) return optional && !readOnly ? <Button size="sm" icon="plus" onClick={() => set(k, { label: { ar: "", en: "" }, href: "/" })}>{label}</Button> : null;
  return (
    <fieldset className="rounded-lg border border-line p-3">
      <legend className="px-1 text-xs font-semibold text-muted">{label}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <input dir={dir} readOnly={readOnly} className="field" aria-label={`${label} — ${d.form.label}`} placeholder={d.form.label} value={v.label[lang]} onChange={(e) => set(k, { ...v, label: { ...v.label, [lang]: e.target.value } })} />
        <input dir="ltr" readOnly={readOnly} className="field num" aria-label={`${label} — ${d.form.href}`} placeholder="/path" value={v.href} onChange={(e) => set(k, { ...v, href: e.target.value })} />
      </div>
      {optional && !readOnly && <Button size="sm" variant="ghost" icon="trash" className="mt-2 text-danger" onClick={() => set(k, null)}>{d.common.remove}</Button>}
    </fieldset>
  );
}

function Items<T extends AnyData>({ c, k, render, blank, title }: { c: Ctx; k: string; render: (it: T, upd: (patch: Partial<T>) => void, i: number) => React.ReactNode; blank: () => T; title: (it: T, i: number) => string }) {
  const { d } = useI18n();
  const { data, set, readOnly } = c;
  const items = (data[k] as T[]) ?? [];
  const upd = (i: number, patch: Partial<T>) => set(k, items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, delta: number) => { const a = items.slice(); const [x] = a.splice(i, 1); a.splice(i + delta, 0, x!); set(k, a); };
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{d.builder.fields.items}</p>
      <ol className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="rounded-lg border border-line bg-raised p-3">
            <div className="mb-2 flex items-center gap-1">
              <span className="num me-auto truncate text-xs font-semibold text-muted">{i + 1}. {title(it, i)}</span>
              {!readOnly && <>
                <Button size="iconSm" variant="ghost" icon="sortUp" disabled={i === 0} aria-label={d.common.moveUp} onClick={() => move(i, -1)} />
                <Button size="iconSm" variant="ghost" icon="sortDown" disabled={i === items.length - 1} aria-label={d.common.moveDown} onClick={() => move(i, 1)} />
                <Button size="iconSm" variant="ghost" icon="trash" className="hover:text-danger" aria-label={d.common.delete} onClick={() => set(k, items.filter((_, j) => j !== i))} />
              </>}
            </div>
            <div className="space-y-3">{render(it, (p) => upd(i, p), i)}</div>
          </li>
        ))}
      </ol>
      {!readOnly && <Button size="sm" icon="plus" className="mt-2" onClick={() => set(k, [...items, blank()])}>{d.form.addItem}</Button>}
    </div>
  );
}

/** Per-block editor. Localized fields show the active language tab; structural fields (links, media, numbers) show on both. */
export function BlockForm({ type, data, onChange, lang, readOnly }: { type: BlockType; data: AnyData; onChange: (d: AnyData) => void; lang: Lang; readOnly?: boolean }) {
  const { d } = useI18n();
  const F = d.builder.fields;
  const set = (k: string, v: unknown) => onChange({ ...data, [k]: v });
  const dir = lang === "ar" ? "rtl" : "ltr";

  const c: Ctx = { data, set, lang, dir, readOnly };
  const L = (v: unknown) => tl(v as Localized, lang) || d.common.untitled;
  const sub = (it: AnyData, upd: (p: AnyData) => void, k: string, label: string, area?: boolean) => <LText c={c} k={k} label={label} area={area} obj={it} onObj={(v) => upd({ [k]: v })} />;
  const e = () => ({ ar: "", en: "" });

  switch (type) {
    case "hero": return (<div className="space-y-4">
      <LText c={c} k="title" label={F.title} /><LText c={c} k="subtitle" label={F.subtitle} area />
      <FieldShell label={F.image}>{() => <MediaField label={F.image} value={(data.image as MediaRef) ?? null} onChange={(m) => set("image", m)} accept={["image"]} readOnly={readOnly} />}</FieldShell>
      <Cta c={c} k="primary" label={F.primary} optional /><Cta c={c} k="secondary" label={F.secondary} optional />
    </div>);
    case "text": {
      const body = (data.body as Localized) ?? e();
      return (<div className="space-y-4">
        <LText c={c} k="heading" label={F.heading} />
        <FieldShell label={F.body}>{() => <RichText key={lang} dir={dir} label={F.body} value={body[lang]} onChange={(h) => set("body", { ...body, [lang]: h })} readOnly={readOnly} />}</FieldShell>
      </div>);
    }
    case "image": return (<div className="space-y-4">
      <FieldShell label={F.image} required>{() => <MediaField label={F.image} value={(data.image as MediaRef)?.id ? (data.image as MediaRef) : null} onChange={(m) => set("image", m)} accept={["image"]} readOnly={readOnly} />}</FieldShell>
      <LText c={c} k="caption" label={F.caption} />
    </div>);
    case "cards": return (<div className="space-y-4"><LText c={c} k="heading" label={F.heading} />
      <Items<AnyData> c={c} k="items" title={(it) => L(it.title)} blank={() => ({ icon: "account", title: e(), body: e(), href: "" })} render={(it, upd) => <>
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldShell label={F.icon}>{({ id }) => <IconField id={id} label={F.icon} value={it.icon as IconName} onChange={(v) => upd({ icon: v })} readOnly={readOnly} />}</FieldShell>
          <FieldShell label={F.href}>{({ id }) => <input id={id} dir="ltr" className="field num" readOnly={readOnly} value={String(it.href ?? "")} onChange={(ev) => upd({ href: ev.target.value })} />}</FieldShell>
        </div>
        {sub(it, upd, "title", F.title)}{sub(it, upd, "body", F.body, true)}
      </>} /></div>);
    case "features": return (<div className="space-y-4"><LText c={c} k="heading" label={F.heading} /><LText c={c} k="body" label={F.body} area />
      <Items<AnyData> c={c} k="items" title={(it) => L(it.title)} blank={() => ({ icon: "shield", title: e(), body: e() })} render={(it, upd) => <>
        <FieldShell label={F.icon}>{({ id }) => <IconField id={id} label={F.icon} value={it.icon as IconName} onChange={(v) => upd({ icon: v })} readOnly={readOnly} />}</FieldShell>
        {sub(it, upd, "title", F.title)}{sub(it, upd, "body", F.body, true)}
      </>} /></div>);
    case "statistics": return (<div className="space-y-4"><LText c={c} k="heading" label={F.heading} />
      <Items<AnyData> c={c} k="items" title={(it) => `${it.value ?? 0}${it.suffix ?? ""} · ${L(it.label)}`} blank={() => ({ value: 0, suffix: "", label: e() })} render={(it, upd) => <>
        <div className="grid grid-cols-2 gap-3">
          <FieldShell label={F.value}>{({ id }) => <input id={id} type="number" dir="ltr" className="field num" readOnly={readOnly} value={Number(it.value ?? 0)} onChange={(ev) => upd({ value: Number(ev.target.value) })} />}</FieldShell>
          <FieldShell label={F.suffix}>{({ id }) => <input id={id} dir="ltr" className="field num" maxLength={4} readOnly={readOnly} value={String(it.suffix ?? "")} onChange={(ev) => upd({ suffix: ev.target.value })} />}</FieldShell>
        </div>
        {sub(it, upd, "label", F.label)}
      </>} /></div>);
    case "faq": return (<div className="space-y-4"><LText c={c} k="heading" label={F.heading} />
      <Items<AnyData> c={c} k="items" title={(it) => L(it.question)} blank={() => ({ question: e(), answer: e() })} render={(it, upd) => <>{sub(it, upd, "question", F.question)}{sub(it, upd, "answer", F.answer, true)}</>} /></div>);
    case "cta": return (<div className="space-y-4"><LText c={c} k="title" label={F.title} /><LText c={c} k="body" label={F.body} area /><Cta c={c} k="primary" label={F.primary} /><Cta c={c} k="secondary" label={F.secondary} optional /></div>);
    case "gallery": return (<div className="space-y-4"><LText c={c} k="heading" label={F.heading} />
      <FieldShell label={F.images}>{() => <MediaListField label={F.images} value={(data.images as MediaRef[]) ?? []} onChange={(v) => set("images", v)} readOnly={readOnly} />}</FieldShell></div>);
    case "video": return (<div className="space-y-4"><LText c={c} k="heading" label={F.heading} />
      <FieldShell label={F.url} help="https://… (.mp4)">{({ id, describedBy }) => <input id={id} aria-describedby={describedBy} type="url" dir="ltr" className="field num" readOnly={readOnly} value={String(data.url ?? "")} onChange={(ev) => set("url", ev.target.value)} />}</FieldShell>
      <FieldShell label={F.poster}>{() => <MediaField label={F.poster} value={(data.poster as MediaRef) ?? null} onChange={(m) => set("poster", m)} accept={["image"]} readOnly={readOnly} />}</FieldShell></div>);
    case "map": return (<div className="space-y-4"><LText c={c} k="heading" label={F.heading} />
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldShell label={F.locationType}>{({ id }) => <select id={id} className="field" disabled={readOnly} value={String(data.type ?? "")} onChange={(ev) => set("type", ev.target.value || null)}>
          <option value="">{d.common.all}</option><option value="branch">{d.nav.branches}</option><option value="atm">{d.nav.atms}</option><option value="agent">{d.nav.agents}</option></select>}</FieldShell>
        <FieldShell label={F.city}>{({ id }) => <select id={id} className="field" disabled={readOnly} value={String(data.city ?? "")} onChange={(ev) => set("city", ev.target.value || null)}>
          <option value="">{d.common.all}</option>{CITY_OPTIONS.map((c) => <option key={c.value} value={c.label.en}>{tl(c.label, lang)}</option>)}</select>}</FieldShell>
      </div></div>);
    case "people": return (<div className="space-y-4"><LText c={c} k="heading" label={F.heading} />
      <Items<AnyData> c={c} k="items" title={(it) => L(it.name)} blank={() => ({ name: e(), role: e(), bio: e(), photo: null })} render={(it, upd) => <>
        <FieldShell label={F.photo}>{() => <MediaField label={F.photo} value={(it.photo as MediaRef) ?? null} onChange={(m) => upd({ photo: m })} accept={["image"]} readOnly={readOnly} />}</FieldShell>
        {sub(it, upd, "name", F.name)}{sub(it, upd, "role", F.role)}{sub(it, upd, "bio", F.bio, true)}
      </>} /></div>);
    case "documents": return (<div className="space-y-4"><LText c={c} k="heading" label={F.heading} />
      <Items<AnyData> c={c} k="items" title={(it) => L(it.title)} blank={() => ({ title: e(), year: new Date().getFullYear(), file: null })} render={(it, upd) => <>
        {sub(it, upd, "title", F.title)}
        <FieldShell label={F.year}>{({ id }) => <input id={id} type="number" dir="ltr" className="field num w-32" min={1990} max={2100} readOnly={readOnly} value={Number(it.year ?? "")} onChange={(ev) => upd({ year: ev.target.value ? Number(ev.target.value) : null })} />}</FieldShell>
        <FieldShell label={F.file}>{() => <MediaField label={F.file} value={(it.file as MediaRef) ?? null} onChange={(m) => upd({ file: m })} accept={["pdf", "document"]} readOnly={readOnly} />}</FieldShell>
      </>} /></div>);
  }
}

export type { BlockDataMap };

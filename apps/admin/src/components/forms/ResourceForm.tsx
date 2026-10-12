"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Localized, LocalizedList, MediaRef, MenuItem, Seo, IconName } from "@/types/api";
import type { FieldDef, FormTab, ResourceDef } from "@/resources/types";
import { Tabs } from "@/components/ui/Controls";
import { Switch } from "@/components/ui/Controls";
import { useI18n } from "@/components/providers/I18nProvider";
import { CharCounter, FieldShell } from "./Field";
import { RichText } from "./RichText";
import { IconField, LatLngField, MediaField, MenuTree, MultiSelect, PermissionMatrix, SeoField, StringList } from "./inputs";
import { PasswordStrength } from "@/components/auth/PasswordField";
import type { Errors } from "./validate";
import { tl } from "@/lib/i18n/config";
import { resourceApi } from "@/lib/api/endpoints";
import { loadRelation } from "@/lib/hooks/useAsync";
import { Icon } from "@/components/ui/Icon";

type Values = Record<string, unknown>;

const LOCALIZED = new Set(["localizedText", "localizedTextarea", "localizedRichText", "localizedList"]);
export const tabOf = (fd: FieldDef): FormTab => fd.tab ?? (fd.type === "seo" ? "seo" : LOCALIZED.has(fd.type) ? "ar" : "settings");

/** Slugify an English title (ASCII only). */
export const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

/**
 * Generic config-driven form. Tabs: العربية / English (localized fields per language), SEO, Settings (everything else, grouped by `section`).
 */
export function ResourceForm({ def, values, onChange, errors, readOnly, isNew, extraSettings }: {
  def: ResourceDef; values: Values; onChange: (patch: Values) => void; errors: Errors; readOnly?: boolean; isNew: boolean; extraSettings?: ReactNode;
}) {
  const { d, f, locale } = useI18n();
  const fields = def.fields.filter((fd) => !(fd.createOnly && !isNew));
  const present = useMemo(() => {
    const s = new Set<FormTab>();
    fields.forEach((fd) => { const t = tabOf(fd); if (t === "ar") { s.add("ar"); s.add("en"); } else s.add(t); });
    return (["ar", "en", "seo", "settings"] as FormTab[]).filter((t) => s.has(t));
  }, [fields]);
  const [tab, setTab] = useState<FormTab>(present[0] ?? "settings");

  // Count errors per tab and jump to the first tab with errors after a failed save.
  const errorTabs = useMemo(() => {
    const m: Record<FormTab, number> = { ar: 0, en: 0, seo: 0, settings: 0 };
    for (const key of Object.keys(errors)) {
      const [name, lang] = key.split(".");
      const fd = fields.find((x) => x.name === name || (x.type === "latlng" && (name === "lat" || name === "lng")));
      if (!fd) { m.settings++; continue; }
      const t = tabOf(fd);
      if (t === "ar") m[lang === "en" ? "en" : "ar"]++; else m[t]++;
    }
    return m;
  }, [errors, fields]);
  const errCount = Object.keys(errors).length;
  useEffect(() => {
    if (!errCount || errorTabs[tab]) return;
    const first = present.find((t) => errorTabs[t] > 0);
    if (first) setTab(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errCount]);

  const tabs = present.map((t) => ({
    id: t, label: (t === "ar" ? <span lang="ar">{d.form.tabs.ar}</span> : t === "en" ? <span lang="en">{d.form.tabs.en}</span> : t === "seo" ? d.form.tabs.seo : d.form.tabs.settings),
    hasError: errorTabs[t] > 0, badge: errorTabs[t] > 0 ? <span className="sr-only">{f(d.form.errorsInTab, { count: errorTabs[t] })}</span> : undefined,
  }));

  const visible = fields.filter((fd) => { const t = tabOf(fd); return t === "ar" ? tab === "ar" || tab === "en" : t === tab; });
  // group settings fields by section
  const groups: { title: Localized | null; items: FieldDef[] }[] = [];
  visible.forEach((fd) => {
    const title = tab === "settings" ? fd.section ?? null : null;
    const g = groups.find((x) => (x.title?.en ?? null) === (title?.en ?? null));
    if (g) g.items.push(fd); else groups.push({ title, items: [fd] });
  });

  return (
    <div className="card">
      <Tabs label={d.form.tabs.settings} tabs={tabs} value={tab} onChange={setTab} className="px-3 pt-1" />
      <div role="tabpanel" className="space-y-6 p-4 sm:p-5">
        {groups.map((g, gi) => (
          <fieldset key={gi} className={clsx("space-y-4", gi > 0 && "border-t border-line pt-5")}>
            {g.title && <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">{tl(g.title, locale)}</legend>}
            <div className="grid gap-4 md:grid-cols-2">
              {g.items.map((fd) => (
                <div key={fd.name} className={clsx(fd.width === "half" ? "md:col-span-1" : "md:col-span-2")}>
                  <FieldRenderer fd={fd} lang={tab === "en" ? "en" : "ar"} values={values} onChange={onChange} errors={errors} readOnly={readOnly} isNew={isNew} />
                </div>
              ))}
            </div>
          </fieldset>
        ))}
        {tab === "settings" && extraSettings}
      </div>
    </div>
  );
}

function RelationSelect({ fd, value, onChange, id, describedBy, invalid, readOnly }: { fd: FieldDef; value: unknown; onChange: (v: unknown) => void; id: string; describedBy?: string; invalid: boolean; readOnly?: boolean }) {
  const { d, locale } = useI18n();
  const [options, setOptions] = useState<{ value: string; label: Localized }[]>([]);
  useEffect(() => {
    if (!fd.relation) return;
    const { endpoint, labelKey, valueKey } = fd.relation;
    loadRelation(endpoint, labelKey, valueKey, () => resourceApi.list(endpoint, { perPage: 100, sort: "position" })).then(setOptions).catch(() => setOptions([]));
  }, [fd.relation]);
  return (
    <select id={id} aria-describedby={describedBy} aria-invalid={invalid || undefined} disabled={readOnly} className="field"
      value={value == null ? "" : String(value)} onChange={(e) => onChange(e.target.value === "" ? null : Number.isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value))}>
      <option value="">{d.form.selectPlaceholder}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{tl(o.label, locale)}</option>)}
    </select>
  );
}

export function FieldRenderer({ fd, lang, values, onChange, errors, readOnly, isNew }: {
  fd: FieldDef; lang: "ar" | "en"; values: Values; onChange: (patch: Values) => void; errors: Errors; readOnly?: boolean; isNew: boolean;
}) {
  const { d, locale } = useI18n();
  const label = tl(fd.label, locale);
  const help = fd.help ? tl(fd.help, locale) : undefined;
  const v = values[fd.name];
  const set = (val: unknown) => onChange({ [fd.name]: val });
  const dir = lang === "ar" ? "rtl" : "ltr";
  const required = fd.required || (fd.requiredOnCreate && isNew);
  const langTag = <span className="ms-1.5 rounded bg-line/60 px-1 text-2xs font-semibold uppercase text-muted">{lang}</span>;

  if (LOCALIZED.has(fd.type)) {
    const err = errors[`${fd.name}.${lang}`] ?? errors[fd.name];
    if (fd.type === "localizedList") {
      const l = (v ?? { ar: [], en: [] }) as LocalizedList;
      return (
        <FieldShell label={<>{label}{langTag}</>} help={help} error={err}>
          {({ id }) => <StringList id={id} dir={dir} label={label} readOnly={readOnly} value={l[lang] ?? []} onChange={(arr) => set({ ...l, [lang]: arr })} />}
        </FieldShell>
      );
    }
    const l = (v ?? { ar: "", en: "" }) as Localized;
    const setL = (s: string) => set({ ...l, [lang]: s });
    return (
      <FieldShell label={<>{label}{langTag}</>} required={required} help={help} error={err}
        counter={fd.maxChars ? <CharCounter value={l[lang] ?? ""} max={fd.maxChars} /> : undefined}>
        {({ id, describedBy }) => fd.type === "localizedRichText"
          ? <RichText id={id} dir={dir} label={label} value={l[lang] ?? ""} onChange={setL} invalid={!!err} readOnly={readOnly} />
          : fd.type === "localizedTextarea"
            ? <textarea id={id} dir={dir} lang={lang} rows={3} className="field resize-y" readOnly={readOnly} aria-invalid={err ? true : undefined} aria-describedby={describedBy} value={l[lang] ?? ""} onChange={(e) => setL(e.target.value)} />
            : <input id={id} dir={dir} lang={lang} className="field" readOnly={readOnly} aria-invalid={err ? true : undefined} aria-describedby={describedBy} value={l[lang] ?? ""} onChange={(e) => setL(e.target.value)} />}
      </FieldShell>
    );
  }

  const err = errors[fd.name];
  switch (fd.type) {
    case "seo": {
      const path = (values.slug ? `/${String(values.slug)}` : "/");
      return <SeoField value={(v as Seo) ?? { title: { ar: "", en: "" }, description: { ar: "", en: "" } }} onChange={set} path={path} readOnly={readOnly} />;
    }
    case "menuTree":
      return <FieldShell label={label} help={help} error={err}>{() => <MenuTree value={(v as MenuItem[]) ?? []} onChange={set} readOnly={readOnly} />}</FieldShell>;
    case "permissions":
      return <FieldShell label={label} help={help} error={err}>{() => <PermissionMatrix value={(v as string[]) ?? []} onChange={set} readOnly={readOnly} />}</FieldShell>;
    case "latlng":
      return (
        <FieldShell label={label} required={required} help={help}>
          {() => <LatLngField lat={values.lat as number | null} lng={values.lng as number | null} readOnly={readOnly} errors={{ lat: errors.lat, lng: errors.lng }}
            onChange={(lat, lng) => onChange({ lat, lng })} />}
        </FieldShell>
      );
    case "boolean":
      return <Switch checked={!!v} onChange={set} disabled={readOnly} label={label} description={help} />;
    case "media":
      return <FieldShell label={label} required={required} help={help} error={err}>{({ id }) => <MediaField id={id} label={label} value={(v as MediaRef) ?? null} onChange={set} accept={fd.accept} readOnly={readOnly} invalid={!!err} />}</FieldShell>;
    case "icon":
      return <FieldShell label={label} required={required} help={help} error={err}>{({ id }) => <IconField id={id} label={label} value={v as IconName} onChange={set} readOnly={readOnly} />}</FieldShell>;
    case "multiselect":
      return <FieldShell label={label} required={required} help={help} error={err}>{() => <MultiSelect label={label} value={(v as string[]) ?? []} onChange={set} options={fd.options ?? []} readOnly={readOnly} />}</FieldShell>;
    case "relation":
      return <FieldShell label={label} required={required} help={help} error={err}>{({ id, describedBy }) => <RelationSelect fd={fd} id={id} describedBy={describedBy} invalid={!!err} readOnly={readOnly} value={v} onChange={set} />}</FieldShell>;
    case "select": case "status":
      return (
        <FieldShell label={label} required={required} help={help} error={err}>
          {({ id, describedBy }) => (
            <select id={id} aria-describedby={describedBy} aria-invalid={err ? true : undefined} disabled={readOnly} className="field" value={v == null ? "" : String(v)} onChange={(e) => set(e.target.value || null)}>
              {!required && <option value="">{d.form.selectPlaceholder}</option>}
              {(fd.options ?? []).map((o) => <option key={o.value} value={o.value}>{tl(o.label, locale)}</option>)}
            </select>
          )}
        </FieldShell>
      );
    case "slug": {
      const source = fd.slugFrom ? (values[fd.slugFrom] as Localized | undefined)?.en : undefined;
      return (
        <FieldShell label={label} required={required} help={help} error={err}
          action={!readOnly && source ? <button type="button" onClick={() => set(slugify(source))} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"><Icon name="refresh" className="size-3.5" />{d.form.generateSlug}</button> : undefined}>
          {({ id, describedBy }) => (
            <div className="flex" dir="ltr">
              {fd.name === "slug" && <span className="inline-flex items-center rounded-s-lg border border-e-0 border-line bg-raised px-2 text-xs text-muted">/</span>}
              <input id={id} dir="ltr" spellCheck={false} autoCapitalize="none" readOnly={readOnly} aria-invalid={err ? true : undefined} aria-describedby={describedBy}
                className={clsx("field num", fd.name === "slug" && "rounded-s-none")} value={String(v ?? "")}
                onChange={(e) => set(e.target.value.toLowerCase().replace(/\s+/g, "-"))} />
            </div>
          )}
        </FieldShell>
      );
    }
    case "number": case "money": case "percent": {
      const suffix = fd.type === "money" ? d.form.currency : fd.type === "percent" ? d.form.percent : null;
      return (
        <FieldShell label={label} required={required} help={help} error={err}>
          {({ id, describedBy }) => (
            <div className="relative">
              <input id={id} type="number" inputMode="decimal" dir="ltr" min={fd.min} max={fd.max} step={fd.step ?? (fd.type === "money" ? 1000 : 1)} readOnly={readOnly}
                aria-invalid={err ? true : undefined} aria-describedby={describedBy} className={clsx("field num", suffix && "pe-12")}
                value={v == null ? "" : String(v)} onChange={(e) => set(e.target.value === "" ? null : Number(e.target.value))} />
              {suffix && <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs text-muted">{suffix}</span>}
            </div>
          )}
        </FieldShell>
      );
    }
    case "date": case "datetime":
      return (
        <FieldShell label={label} required={required} help={help} error={err}>
          {({ id, describedBy }) => (
            <input id={id} type={fd.type === "date" ? "date" : "datetime-local"} dir="ltr" readOnly={readOnly} aria-invalid={err ? true : undefined} aria-describedby={describedBy} className="field num"
              value={v ? (fd.type === "date" ? String(v).slice(0, 10) : toLocalInput(String(v))) : ""}
              onChange={(e) => set(e.target.value ? (fd.type === "date" ? e.target.value : new Date(e.target.value).toISOString()) : null)} />
          )}
        </FieldShell>
      );
    case "password":
      return (
        <FieldShell label={label} required={required} help={help} error={err}>
          {({ id, describedBy }) => <>
            <input id={id} type="password" dir="ltr" autoComplete="new-password" aria-invalid={err ? true : undefined} aria-describedby={describedBy} className="field" value={String(v ?? "")} onChange={(e) => set(e.target.value)} />
            <PasswordStrength value={String(v ?? "")} />
          </>}
        </FieldShell>
      );
    case "textarea":
      return <FieldShell label={label} required={required} help={help} error={err}>{({ id, describedBy }) => <textarea id={id} rows={3} className="field" readOnly={readOnly} aria-invalid={err ? true : undefined} aria-describedby={describedBy} value={String(v ?? "")} onChange={(e) => set(e.target.value)} />}</FieldShell>;
    default:
      return (
        <FieldShell label={label} required={required} help={help} error={err}>
          {({ id, describedBy }) => (
            <input id={id} type={fd.type === "email" ? "email" : fd.type === "url" ? "url" : "text"} dir={fd.type === "text" && !fd.placeholder?.startsWith("/") && !fd.placeholder?.startsWith("+") ? undefined : "ltr"}
              placeholder={fd.placeholder} readOnly={readOnly} aria-invalid={err ? true : undefined} aria-describedby={describedBy} className="field"
              value={String(v ?? "")} onChange={(e) => set(e.target.value)} />
          )}
        </FieldShell>
      );
  }
}

export function toLocalInput(iso: string) {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

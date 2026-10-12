"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Seo } from "@/types/api";
import type { AdminSettings } from "@/types/admin";
import { Button } from "@/components/ui/Button";
import { Card, ErrorState, Forbidden, PageHeader, Skeleton } from "@/components/ui/States";
import { FieldShell } from "@/components/forms/Field";
import { SeoField } from "@/components/forms/inputs";
import { useI18n } from "@/components/providers/I18nProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { settingsApi } from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/errors";
import { useAsync, useDirtyGuard } from "@/lib/hooks/useAsync";
import { fromServer, type Errors } from "@/components/forms/validate";

export function SettingsScreen() {
  const { d } = useI18n();
  const { can } = useAuth();
  const toast = useToast();
  const { data, error, loading, setData } = useAsync(() => settingsApi.get(), []);
  const [v, setV] = useState<AdminSettings | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data) setV(structuredClone(data)); }, [data]);
  const dirty = !!v && !!data && JSON.stringify(v) !== JSON.stringify(data);
  useDirtyGuard(dirty, d.common.unsavedLeave);

  if (!can("settings.view")) return <Forbidden />;
  if (error) return <ErrorState error={error} />;
  if (loading || !v) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /></div>;
  const ro = !can("settings.update");
  const s = d.settings;

  const validate = (x: AdminSettings): Errors => {
    const e: Errors = {};
    if (!x.bankName.ar.trim()) e["bankName.ar"] = d.form.required;
    if (!x.bankName.en.trim()) e["bankName.en"] = d.form.required;
    if (x.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.email)) e.email = d.form.invalidEmail;
    const urls: [string, string][] = [["internetBankingUrl", x.internetBankingUrl], ["appStores.googlePlay", x.appStores.googlePlay], ["appStores.appStore", x.appStores.appStore],
      ...Object.entries(x.social).map(([k, u]) => [`social.${k}`, u] as [string, string])];
    urls.forEach(([k, u]) => { if (u && !/^https:\/\/\S+$/.test(u)) e[k] = d.form.invalidUrl; });
    return e;
  };
  const save = async () => {
    const e = validate(v); setErrors(e);
    if (Object.keys(e).length) { toast({ tone: "error", title: d.form.invalid }); return; }
    setSaving(true);
    try { const saved = await settingsApi.update(v); setData(saved); toast({ tone: "success", title: s.saved }); }
    catch (err) { if (isApiError(err) && err.kind === "validation") setErrors(fromServer(err.fieldErrors)); toast({ tone: "error", title: d.errors.generic }); }
    finally { setSaving(false); }
  };

  const txt = (label: string, key: string, value: string, onChange: (x: string) => void, opts: { dir?: "ltr" | "rtl"; type?: string; help?: ReactNode } = {}) => (
    <FieldShell label={label} error={errors[key]} help={opts.help}>
      {({ id, describedBy }) => <input id={id} aria-describedby={describedBy} type={opts.type ?? "text"} dir={opts.dir} readOnly={ro} aria-invalid={errors[key] ? true : undefined}
        className="field" value={value} onChange={(e) => onChange(e.target.value)} />}
    </FieldShell>
  );

  return (
    <form onSubmit={(e) => { e.preventDefault(); void save(); }} noValidate className="space-y-4 pb-4">
      <PageHeader title={s.title} subtitle={s.subtitle} />
      <Card id="identity" title={s.groups.identity}>
        <div className="grid gap-4 md:grid-cols-2">
          {txt(`${s.bankName} (${d.common.arabic})`, "bankName.ar", v.bankName.ar, (x) => setV({ ...v, bankName: { ...v.bankName, ar: x } }), { dir: "rtl" })}
          {txt(`${s.bankName} (English)`, "bankName.en", v.bankName.en, (x) => setV({ ...v, bankName: { ...v.bankName, en: x } }), { dir: "ltr" })}
        </div>
      </Card>
      <Card id="contact" title={s.groups.contact}>
        <div className="grid gap-4 md:grid-cols-3">
          {txt(s.phone, "phone", v.phone, (x) => setV({ ...v, phone: x }), { dir: "ltr", type: "tel" })}
          {txt(s.tollFree, "tollFree", v.tollFree, (x) => setV({ ...v, tollFree: x }), { dir: "ltr", type: "tel" })}
          {txt(s.email, "email", v.email, (x) => setV({ ...v, email: x }), { dir: "ltr", type: "email" })}
          {txt(`${s.address} (${d.common.arabic})`, "address.ar", v.address.ar, (x) => setV({ ...v, address: { ...v.address, ar: x } }), { dir: "rtl" })}
          {txt(`${s.address} (English)`, "address.en", v.address.en, (x) => setV({ ...v, address: { ...v.address, en: x } }), { dir: "ltr" })}
        </div>
      </Card>
      <Card id="social" title={s.groups.social}>
        <div className="grid gap-4 md:grid-cols-3">
          {(Object.keys(v.social) as (keyof AdminSettings["social"])[]).map((k) => txt(k === "x" ? "X" : k[0]!.toUpperCase() + k.slice(1), `social.${k}`, v.social[k], (x) => setV({ ...v, social: { ...v.social, [k]: x } }), { dir: "ltr", type: "url" }))}
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card id="apps" title={s.groups.apps}>
          <div className="space-y-4">
            {txt(s.googlePlay, "appStores.googlePlay", v.appStores.googlePlay, (x) => setV({ ...v, appStores: { ...v.appStores, googlePlay: x } }), { dir: "ltr", type: "url" })}
            {txt(s.appStore, "appStores.appStore", v.appStores.appStore, (x) => setV({ ...v, appStores: { ...v.appStores, appStore: x } }), { dir: "ltr", type: "url" })}
          </div>
        </Card>
        <Card id="integrations" title={s.groups.integrations}>
          <div className="space-y-4">
            {txt(s.internetBankingUrl, "internetBankingUrl", v.internetBankingUrl, (x) => setV({ ...v, internetBankingUrl: x }), { dir: "ltr", type: "url" })}
            {txt(s.turnstile, "turnstileSiteKey", v.turnstileSiteKey ?? "", (x) => setV({ ...v, turnstileSiteKey: x || null }), { dir: "ltr", help: s.turnstileHint })}
          </div>
        </Card>
      </div>
      <Card id="seo" title={s.groups.seo}>
        <SeoField value={v.defaultSeo} onChange={(seo: Seo) => setV({ ...v, defaultSeo: seo })} path="/" readOnly={ro} />
      </Card>
      {!ro && (
        <div className="sticky bottom-3 z-30 flex items-center gap-3 rounded-card border border-line bg-surface/95 px-4 py-2.5 shadow-pop backdrop-blur">
          <span className="flex-1 text-sm">{dirty && <span className="inline-flex items-center gap-2 font-semibold"><span className="size-2 rounded-full bg-accent" />{d.form.saveBar}</span>}</span>
          {dirty && <Button variant="ghost" onClick={() => { setV(structuredClone(data!)); setErrors({}); }}>{d.common.discard}</Button>}
          <Button type="submit" variant="primary" icon="check" loading={saving} disabled={!dirty}>{d.common.save}</Button>
        </div>
      )}
    </form>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import clsx from "clsx";
import type { Locale } from "@/types/content";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { FILE_FIELDS, SCHEMAS, checkFile, validateField, validateForm, type ErrorCode, type FieldErrors } from "@/lib/forms/validation";
import { Icon } from "@/components/ui/Icon";
import { ToastViewport, useToasts } from "@/components/ui/Toast";
import { Turnstile } from "./Turnstile";
import type { FieldSpec, FormValue, FormValues, PublicFormProps } from "./types";

/** Only the strings the form needs are sent to the browser (keeps the client payload small). */
export type FormStrings = Pick<Dictionary, "forms" | "common">;

type Status = "idle" | "submitting" | "success";
type Banner = null | { kind: "network" | "server" | "rateLimited" | "tooLarge" | "summary" };

const FILE_ERRORS = new Set<ErrorCode>(["fileType", "fileTypePdf", "fileSize"]);

export function PublicForm({ kind, fields, initial = {}, hidden = {}, turnstileSiteKey, nonce, labelledBy, locale, strings }: PublicFormProps & { locale: Locale; strings: FormStrings }) {
  const f = strings.forms;
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const schema = SCHEMAS[kind];

  const blank = (): FormValues => Object.fromEntries(fields.map((x) => [x.name, x.kind === "checkbox" ? false : x.kind === "file" ? null : ""]));
  const [values, setValues] = useState<FormValues>(() => ({ ...blank(), ...initial, consent: false, website: "" }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [banner, setBanner] = useState<Banner>(null);
  const [result, setResult] = useState<{ reference: string; demo: boolean } | null>(null);
  const [token, setToken] = useState("");
  const [resetSignal, setResetSignal] = useState(0);
  const [copied, setCopied] = useState(false);
  const { toasts, show, dismiss } = useToasts();

  const all = (): Record<string, unknown> => ({ ...values, ...hidden });
  const visible = (spec: FieldSpec) => !spec.showIf || values[spec.showIf.field] === spec.showIf.equals;
  const id = (name: string) => `${uid}-${name}`;
  const isRequired = (name: string) => Boolean(schema[name]?.required || schema[name]?.requiredIf?.(all()));

  useEffect(() => { if (status === "success") successRef.current?.focus(); }, [status]);

  const set = (name: string, v: FormValue) => {
    setValues((prev) => {
      const next = { ...prev, [name]: v };
      if (touched[name] || errors[name]) {
        const e = validateField(kind, name, { ...next, ...hidden });
        setErrors((er) => { const c = { ...er }; if (e) c[name] = e; else delete c[name]; return c; });
      }
      return next;
    });
  };

  const blur = (name: string) => {
    setTouched((t) => ({ ...t, [name]: true }));
    const e = validateField(kind, name, all());
    setErrors((er) => { const c = { ...er }; if (e) c[name] = e; else delete c[name]; return c; });
  };

  const onFile = (name: string, file: File | null, accept: "pdf" | "doc-image") => {
    if (file) {
      const e = checkFile(file, accept);
      if (e) {
        setErrors((er) => ({ ...er, [name]: e }));
        setValues((v) => ({ ...v, [name]: null }));
        const input = document.getElementById(id(name)) as HTMLInputElement | null;
        if (input) input.value = "";
        return;
      }
    }
    set(name, file);
    setTouched((t) => ({ ...t, [name]: true }));
  };

  const focusFirstError = (errs: FieldErrors) => {
    const first = [...fields.map((x) => x.name), "consent"].find((n) => errs[n]);
    if (first) document.getElementById(id(first))?.focus();
  };

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (status === "submitting") return;
    const check = validateForm(kind, all());
    // Hidden conditional fields are not validated client-side unless shown
    if (!check.ok) {
      setErrors(check.errors);
      setTouched(Object.fromEntries(Object.keys(check.errors).map((k) => [k, true])));
      setBanner({ kind: "summary" });
      focusFirstError(check.errors);
      return;
    }

    setStatus("submitting");
    setBanner(null);
    const multipart = Boolean(FILE_FIELDS[kind]);
    let body: BodyInit;
    const headers: Record<string, string> = { Accept: "application/json" };
    const payload = { ...check.data, ...hidden, website: String(values.website ?? ""), locale, ...(token ? { turnstileToken: token } : {}) };
    if (multipart) {
      const fd = new FormData();
      for (const [k, v] of Object.entries(payload)) if (v !== undefined && v !== null) fd.append(k, typeof v === "boolean" ? (v ? "1" : "0") : String(v));
      for (const name of FILE_FIELDS[kind] ?? []) { const file = values[name]; if (file instanceof File) fd.append(name, file, file.name); }
      body = fd;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(payload);
    }

    try {
      const res = await fetch(`/api/forms/${kind}`, { method: "POST", body, headers, credentials: "same-origin" });
      const json = (await res.json().catch(() => ({}))) as { data?: { reference?: string }; demo?: boolean; errors?: Record<string, string[]> };
      if (res.status === 201 && json.data?.reference) {
        setResult({ reference: json.data.reference, demo: Boolean(json.demo) });
        setStatus("success");
        window.scrollTo({ top: (formRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 120, behavior: "smooth" });
        return;
      }
      setStatus("idle");
      setResetSignal((n) => n + 1);
      setToken("");
      if (res.status === 422 && json.errors) {
        const mapped: FieldErrors = {};
        for (const [field, msgs] of Object.entries(json.errors)) {
          const code = msgs[0] as ErrorCode | undefined;
          mapped[field] = code && code in f.errors ? code : "required";
        }
        setErrors(mapped);
        setBanner({ kind: "summary" });
        focusFirstError(mapped);
        return;
      }
      const kindOf = res.status === 429 ? "rateLimited" : res.status === 413 ? "tooLarge" : "server";
      setBanner({ kind: kindOf });
      show(f[kindOf], "error");
      bannerRef.current?.focus();
    } catch {
      setStatus("idle");
      setBanner({ kind: "network" });
      show(f.network, "error");
      bannerRef.current?.focus();
    }
  }

  const reset = () => {
    setValues({ ...blank(), ...initial, consent: false, website: "" });
    setErrors({}); setTouched({}); setResult(null); setBanner(null); setStatus("idle"); setToken(""); setCopied(false);
    setResetSignal((n) => n + 1);
  };

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.reference);
      setCopied(true);
      show(`${strings.common.copied}: ${result.reference}`, "success");
    } catch { /* clipboard blocked — reference stays selectable */ }
  };

  /* ───────── Success screen ───────── */
  if (status === "success" && result) {
    return (
      <div className="grid gap-6 rounded-[20px] border border-success/30 bg-surface p-6 md:p-8" data-form-success={kind}>
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-success/15 text-success"><Icon name="shield" className="size-6" /></span>
          <div>
            <h2 ref={successRef} tabIndex={-1} className="text-2xl font-bold outline-none">{f.success.title}</h2>
            <p className="mt-1 text-muted">{f.success.keep}</p>
          </div>
        </div>
        <div className="grid gap-2 rounded-card bg-brand-900 p-5 text-white">
          <p className="text-sm text-white/70">{f.success.reference}</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <output data-reference className="tabular select-all font-mono text-2xl font-semibold tracking-wide text-accent md:text-3xl" dir="ltr">{result.reference}</output>
            <button type="button" onClick={copy} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/30 px-4 text-sm font-semibold hover:bg-white/10">
              <Icon name="payment" className="size-4" />{copied ? strings.common.copied : strings.common.copy}
            </button>
          </div>
        </div>
        <div>
          <h3 className="mb-3 font-semibold">{f.success.next}</h3>
          <ol className="grid gap-3">
            {f.success.steps[kind].map((step, i) => (
              <li key={step} className="flex gap-3"><span className="tabular grid size-7 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">{i + 1}</span><span className="pt-0.5">{step}</span></li>
            ))}
          </ol>
        </div>
        {result.demo && <p className="rounded-card border border-dashed border-warning/50 p-3 text-sm text-muted">{f.success.demo}</p>}
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="inline-flex min-h-11 items-center rounded-full border border-line px-5 font-semibold hover:border-brand-700">{f.success.again}</button>
          <Link href={`/${locale}`} className="inline-flex min-h-11 items-center rounded-full bg-brand-900 px-5 font-semibold text-white hover:bg-brand-700">{f.success.home}</Link>
        </div>
        <ToastViewport toasts={toasts} onDismiss={dismiss} closeLabel={strings.common.close} />
      </div>
    );
  }

  /* ───────── Form ───────── */
  const control = (invalid: boolean) => clsx("min-h-12 w-full rounded-card border bg-surface px-3 transition focus:border-brand-700",
    invalid ? "border-danger" : "border-line");
  const submitting = status === "submitting";

  const renderField = (spec: FieldSpec) => {
    if (!visible(spec)) return null;
    const name = spec.name;
    const err = touched[name] || FILE_ERRORS.has(errors[name]!) || banner?.kind === "summary" ? errors[name] : undefined;
    const hint = (f.hints as Record<string, string>)[name];
    const describedBy = [hint && `${id(name)}-hint`, err && `${id(name)}-err`].filter(Boolean).join(" ") || undefined;
    const label = (f.labels as Record<string, string>)[name] ?? name;
    const required = isRequired(name);
    const common = {
      id: id(name), name, "aria-invalid": err ? true : undefined, "aria-describedby": describedBy, "aria-required": required || undefined,
      onBlur: () => blur(name), disabled: submitting, dir: spec.ltr ? "ltr" as const : undefined,
    };
    const value = typeof values[name] === "string" ? (values[name] as string) : "";

    if (spec.kind === "checkbox") {
      return (
        <div key={name} className="sm:col-span-2">
          <label htmlFor={id(name)} className="flex min-h-11 cursor-pointer items-center gap-3 font-medium">
            <input {...common} type="checkbox" checked={values[name] === true} onChange={(e) => set(name, e.target.checked)} className="size-5 accent-[rgb(var(--brand-700))]" />
            {label}
          </label>
        </div>
      );
    }

    return (
      <div key={name} className={clsx("grid content-start gap-1.5", spec.full && "sm:col-span-2")} data-field={name}>
        <label htmlFor={id(name)} className="text-sm font-medium">
          {label}
          {required ? <span className="text-danger" aria-hidden="true"> *</span> : <span className="text-[13px] font-normal text-muted"> ({strings.common.optional})</span>}
        </label>
        {spec.kind === "select" ? (
          <select {...common} value={value} onChange={(e) => set(name, e.target.value)} className={control(Boolean(err))}>
            <option value="">{f.choose}</option>
            {spec.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : spec.kind === "textarea" ? (
          <textarea {...common} value={value} onChange={(e) => set(name, e.target.value)} rows={spec.rows ?? 4} maxLength={spec.maxLength} className={clsx(control(Boolean(err)), "py-3")} />
        ) : spec.kind === "file" ? (
          <input {...common} type="file" accept={spec.accept} dir={undefined}
            onChange={(e) => onFile(name, e.target.files?.[0] ?? null, name === "cv" ? "pdf" : "doc-image")}
            className={clsx(control(Boolean(err)), "py-2.5 file:me-3 file:rounded-full file:border-0 file:bg-brand-100 file:px-4 file:py-1.5 file:font-semibold file:text-brand-700")} />
        ) : (
          <input {...common} value={value} onChange={(e) => set(name, e.target.value)}
            type={spec.kind === "number" ? "text" : spec.kind} inputMode={spec.inputMode} autoComplete={spec.autoComplete} maxLength={spec.maxLength} max={spec.max}
            className={clsx(control(Boolean(err)), spec.ltr && "text-start")} />
        )}
        {hint && <p id={`${id(name)}-hint`} className="text-[13px] text-muted">{hint}</p>}
        {err && <p id={`${id(name)}-err`} className="flex items-center gap-1.5 text-[13px] font-medium text-danger"><Icon name="eye" className="size-4 shrink-0" />{f.errors[err]}</p>}
      </div>
    );
  };

  const consentErr = errors.consent && (touched.consent || banner?.kind === "summary") ? errors.consent : undefined;

  return (
    <form ref={formRef} noValidate onSubmit={submit} aria-labelledby={labelledBy} aria-busy={submitting} data-form={kind}
      className="relative grid gap-6 rounded-[20px] border border-line bg-surface p-5 shadow-lift md:p-8">
      {banner && (
        <div ref={bannerRef} tabIndex={-1} role="alert" className={clsx("flex flex-wrap items-center justify-between gap-3 rounded-card border p-4 text-sm outline-none",
          banner.kind === "summary" ? "border-warning/50 bg-warning/10" : "border-danger/40 bg-danger/10")}>
          <p className="flex items-center gap-2 font-medium"><Icon name="eye" className="size-5 shrink-0" />{banner.kind === "summary" ? f.summary : f[banner.kind]}</p>
          {banner.kind === "network" || banner.kind === "server" ? (
            <button type="button" onClick={() => submit()} className="inline-flex min-h-10 items-center rounded-full bg-brand-900 px-4 font-semibold text-white">{strings.common.retry}</button>
          ) : null}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">{fields.map(renderField)}</div>

      {/* Honeypot: invisible to people and assistive tech, attractive to bots. */}
      <div aria-hidden="true" className="absolute -start-[10000px] top-auto size-px overflow-hidden">
        <label htmlFor={id("website")}>{f.labels.website}</label>
        <input id={id("website")} name="website" type="text" tabIndex={-1} autoComplete="off" value={String(values.website ?? "")} onChange={(e) => setValues((v) => ({ ...v, website: e.target.value }))} />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor={id("consent")} className="flex cursor-pointer items-start gap-3 text-[15px]">
          <input id={id("consent")} name="consent" type="checkbox" checked={values.consent === true} disabled={submitting}
            onChange={(e) => { set("consent", e.target.checked); setTouched((t) => ({ ...t, consent: true })); }}
            aria-invalid={consentErr ? true : undefined} aria-describedby={consentErr ? `${id("consent")}-err` : undefined} aria-required
            className="mt-1 size-5 shrink-0 accent-[rgb(var(--brand-700))]" />
          <span>
            {f.consentBefore}{" "}
            <Link href={`/${locale}/privacy`} target="_blank" className="font-semibold text-brand-700 underline underline-offset-4">{f.consentLink}</Link>{" "}
            {f.consentAfter}<span className="text-danger" aria-hidden="true"> *</span>
          </span>
        </label>
        {consentErr && <p id={`${id("consent")}-err`} className="flex items-center gap-1.5 ps-8 text-[13px] font-medium text-danger">{f.errors[consentErr]}</p>}
      </div>

      {turnstileSiteKey && (
        <Turnstile siteKey={turnstileSiteKey} nonce={nonce} locale={locale} onToken={setToken} resetSignal={resetSignal} label={f.security} />
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={submitting}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 font-semibold text-brand-900 shadow-lift transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70">
          {submitting && <span className="size-4 animate-spin rounded-full border-2 border-brand-900/30 border-t-brand-900" aria-hidden="true" />}
          {submitting ? f.submitting : f.submit[kind]}
        </button>
        <p className="text-[13px] text-muted"><span className="text-danger" aria-hidden="true">*</span> {strings.common.required}</p>
      </div>
      <ToastViewport toasts={toasts} onDismiss={dismiss} closeLabel={strings.common.close} />
    </form>
  );
}

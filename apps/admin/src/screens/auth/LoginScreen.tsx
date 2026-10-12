"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AuthLayout, Alert } from "@/components/auth/AuthCard";
import { PasswordInput } from "@/components/auth/PasswordField";
import { OtpInput } from "@/components/auth/OtpInput";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Controls";
import { useI18n } from "@/components/providers/I18nProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { authApi } from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/errors";
import { DEMO } from "@/lib/env";

const DEMO_CREDS = { email: "admin@withaq.example", password: "Demo@Withaq2026!", code: "123456" };

export function LoginScreen() {
  const { d, f, locale } = useI18n();
  const { setUser, status } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ tone: "danger" | "warning"; text: string } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const next = params.get("next");
  const safeNext = next && /^\/(ar|en)(\/[\w\-/?=&%]*)?$/.test(next) && !next.includes("/login") ? next : `/${locale}`;

  useEffect(() => { if (status === "authenticated") router.replace(safeNext); }, [status, router, safeNext]);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleError = (e: unknown, codeStep = false) => {
    if (!isApiError(e)) { setError({ tone: "danger", text: d.errors.generic }); return; }
    if (e.kind === "locked") setError({ tone: "warning", text: f(d.auth.locked, { minutes: Math.max(1, Math.ceil((e.retryAfter ?? 900) / 60)) }) });
    else if (e.kind === "rate_limited") { setCooldown(e.retryAfter ?? 30); setError({ tone: "warning", text: f(d.auth.rateLimited, { seconds: e.retryAfter ?? 30 }) }); }
    else if (e.kind === "validation") setError({ tone: "danger", text: codeStep ? d.auth.invalidCode : d.auth.invalid });
    else if (e.kind === "unauthenticated" && codeStep) { setStep("credentials"); setError({ tone: "danger", text: d.auth.session }); }
    else if (e.kind === "network") setError({ tone: "danger", text: d.errors.network });
    else setError({ tone: "danger", text: d.errors.generic });
  };

  const submitCredentials = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || cooldown > 0) return;
    setBusy(true); setError(null);
    try {
      const res = await authApi.login({ login: login.trim(), password, remember });
      if (res.twoFactorRequired) { setStep("2fa"); setCode(""); }
      else if (res.user) { setUser(res.user); router.replace(safeNext); }
    } catch (err) { handleError(err); } finally { setBusy(false); }
  };

  const submitCode = async (value?: string) => {
    const c = value ?? code;
    if (busy) return;
    if (!useRecovery && c.length !== 6) return;
    setBusy(true); setError(null);
    try {
      const { user } = await authApi.twoFactorChallenge(useRecovery ? { recoveryCode: recovery.trim() } : { code: c });
      setUser(user);
      router.replace(safeNext);
    } catch (err) { handleError(err, true); setCode(""); } finally { setBusy(false); }
  };

  const demoPanel = DEMO && (
    <div className="mt-6 rounded-card border border-dashed border-accent/60 bg-accent/[.06] p-3 text-sm">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="font-semibold">{d.auth.demoTitle}</p>
        {step === "credentials"
          ? <button type="button" className="text-xs font-semibold text-brand-700 hover:underline" onClick={() => { setLogin(DEMO_CREDS.email); setPassword(DEMO_CREDS.password); }}>{d.auth.fillDemo}</button>
          : <button type="button" className="text-xs font-semibold text-brand-700 hover:underline" onClick={() => { setUseRecovery(false); setCode(DEMO_CREDS.code); void submitCode(DEMO_CREDS.code); }}>{d.auth.fillDemo}</button>}
      </div>
      <dl dir="ltr" className="num grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
        <dt className="text-muted">email</dt><dd className="select-all">{DEMO_CREDS.email}</dd>
        <dt className="text-muted">password</dt><dd className="select-all">{DEMO_CREDS.password}</dd>
        <dt className="text-muted">2FA</dt><dd className="select-all">{DEMO_CREDS.code}</dd>
      </dl>
      <p className="mt-2 text-xs text-muted">{d.auth.demoNote}</p>
    </div>
  );

  if (step === "2fa") {
    return (
      <AuthLayout title={d.auth.twoFactorTitle} subtitle={useRecovery ? undefined : d.auth.twoFactorBody} aside={demoPanel}>
        {error && <Alert tone={error.tone}>{error.text}</Alert>}
        <form onSubmit={(e) => { e.preventDefault(); void submitCode(); }} className="space-y-4" noValidate>
          {useRecovery ? (
            <div>
              <label htmlFor="recovery" className="label">{d.auth.recoveryCode}</label>
              <input id="recovery" className="field num uppercase" dir="ltr" autoComplete="off" value={recovery} onChange={(e) => setRecovery(e.target.value)} placeholder="XXXX-XXXX-XXXX" autoFocus />
            </div>
          ) : (
            <OtpInput value={code} onChange={setCode} onComplete={(v) => void submitCode(v)} invalid={!!error} disabled={busy} />
          )}
          <Button type="submit" variant="primary" className="w-full" loading={busy} disabled={useRecovery ? recovery.trim().length < 8 : code.length !== 6}>{d.auth.verify}</Button>
        </form>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
          <button type="button" className="font-semibold text-brand-700 hover:underline" onClick={() => { setUseRecovery((u) => !u); setError(null); }}>
            {useRecovery ? d.auth.useCode : d.auth.useRecovery}
          </button>
          <button type="button" className="text-muted hover:text-ink" onClick={() => { setStep("credentials"); setError(null); }}>{d.auth.backToLogin}</button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={d.auth.title} subtitle={d.auth.subtitle} aside={demoPanel}>
      {params.get("expired") && !error && <Alert tone="info">{d.auth.session}</Alert>}
      {params.get("reset") && !error && <Alert tone="success">{d.auth.resetDone}</Alert>}
      {error && <Alert tone={error.tone}>{error.text}</Alert>}
      <form onSubmit={submitCredentials} className="space-y-4" noValidate>
        <div>
          <label htmlFor="login" className="label">{d.auth.login}</label>
          <input id="login" className="field" dir="ltr" autoComplete="username" autoCapitalize="none" spellCheck={false} required
            value={login} onChange={(e) => setLogin(e.target.value)} autoFocus />
        </div>
        <div>
          <PasswordInput label={d.auth.password} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="mt-1.5 text-end"><Link href={`/${locale}/forgot-password`} className="text-sm font-semibold text-brand-700 hover:underline">{d.auth.forgot}</Link></div>
        </div>
        <Checkbox checked={remember} onChange={setRemember} label={d.auth.remember} />
        <Button type="submit" variant="primary" className="w-full" loading={busy} disabled={!login.trim() || !password || cooldown > 0}>
          {busy ? d.auth.submitting : cooldown > 0 ? `${d.auth.submit} (${cooldown})` : d.auth.submit}
        </Button>
      </form>
    </AuthLayout>
  );
}

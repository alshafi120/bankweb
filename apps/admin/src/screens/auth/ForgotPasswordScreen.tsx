"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthLayout, Alert } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/components/providers/I18nProvider";
import { authApi } from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/errors";

export function ForgotPasswordScreen() {
  const { d, f, locale } = useI18n();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) { setError(d.form.invalidEmail); return; }
    setBusy(true); setError(null);
    try { await authApi.forgotPassword(email.trim()); setDone(true); }
    catch (err) {
      // Always 202 server-side; only surface rate limits / network problems.
      if (isApiError(err) && err.kind === "rate_limited") setError(f(d.auth.rateLimited, { seconds: err.retryAfter ?? 60 }));
      else if (isApiError(err) && err.kind === "network") setError(d.errors.network);
      else setDone(true);
    } finally { setBusy(false); }
  };

  return (
    <AuthLayout title={d.auth.forgotTitle} subtitle={done ? undefined : d.auth.forgotBody}>
      {done ? <Alert tone="success">{d.auth.forgotDone}</Alert> : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {error && <Alert>{error}</Alert>}
          <div>
            <label htmlFor="email" className="label">{d.auth.email}</label>
            <input id="email" type="email" className="field" dir="ltr" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </div>
          <Button type="submit" variant="primary" className="w-full" loading={busy} disabled={!email}>{d.auth.sendLink}</Button>
        </form>
      )}
      <p className="mt-5 text-sm"><Link href={`/${locale}/login`} className="font-semibold text-brand-700 hover:underline">{d.auth.backToLogin}</Link></p>
    </AuthLayout>
  );
}

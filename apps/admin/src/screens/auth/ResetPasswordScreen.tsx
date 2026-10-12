"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthLayout, Alert } from "@/components/auth/AuthCard";
import { PasswordInput, PasswordStrength } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/components/providers/I18nProvider";
import { authApi } from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/errors";
import { meetsPolicy } from "@/lib/password";
import { DEMO } from "@/lib/env";

export function ResetPasswordScreen() {
  const { d, locale } = useI18n();
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? (DEMO ? "demo-token" : "");
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirm.length > 0 && confirm !== password;
  const ok = !!token && !!email && meetsPolicy(password) && password === confirm;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ok) return;
    setBusy(true); setError(null);
    try {
      await authApi.resetPassword({ token, email: email.trim(), password, passwordConfirmation: confirm });
      router.replace(`/${locale}/login?reset=1`);
    } catch (err) {
      setError(isApiError(err) && err.kind === "validation" ? d.auth.resetInvalid : d.errors.generic);
    } finally { setBusy(false); }
  };

  return (
    <AuthLayout title={d.auth.resetTitle}>
      {!token && <Alert>{d.auth.resetInvalid}</Alert>}
      {error && <Alert>{error}</Alert>}
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="label">{d.auth.email}</label>
          <input id="email" type="email" className="field" dir="ltr" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <PasswordInput label={d.auth.newPassword} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <PasswordStrength value={password} />
        </div>
        <PasswordInput label={d.auth.confirmPassword} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={mismatch ? d.auth.mismatch : null} />
        <Button type="submit" variant="primary" className="w-full" loading={busy} disabled={!ok}>{d.auth.resetSubmit}</Button>
      </form>
      <p className="mt-5 text-sm"><Link href={`/${locale}/login`} className="font-semibold text-brand-700 hover:underline">{d.auth.backToLogin}</Link></p>
    </AuthLayout>
  );
}

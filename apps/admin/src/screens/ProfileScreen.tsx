"use client";

import { useMemo, useState } from "react";
import type { TwoFactorSetup } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { Card, PageHeader, Skeleton } from "@/components/ui/States";
import { PasswordInput, PasswordStrength } from "@/components/auth/PasswordField";
import { OtpInput } from "@/components/auth/OtpInput";
import { useI18n } from "@/components/providers/I18nProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { authApi } from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/errors";
import { useAsync } from "@/lib/hooks/useAsync";
import { meetsPolicy } from "@/lib/password";
import { sanitizeSvg } from "@/lib/sanitize";
import { formatDateTime, formatRelative } from "@/lib/i18n/config";
import { downloadText } from "@/lib/csv";

export function ProfileScreen() {
  const { d } = useI18n();
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="space-y-4">
      <PageHeader title={d.profile.title} />
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4"><AccountCard /><PasswordCard /></div>
        <div className="space-y-4"><TwoFactorCard /><SessionsCard /></div>
      </div>
    </div>
  );
}

function AccountCard() {
  const { d, locale } = useI18n();
  const { user } = useAuth();
  const roles = d.roles as Record<string, string>;
  return (
    <Card id="acct" title={d.profile.account}>
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-arch bg-brand-900 text-lg font-bold text-white dark:bg-brand-700 dark:text-bg">{user!.name.slice(0, 1)}</span>
        <div className="min-w-0">
          <p className="truncate font-semibold">{user!.name}</p>
          <p className="truncate text-sm text-muted" dir="ltr">{user!.email} · @{user!.username}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted">{d.profile.roles}</dt><dd className="flex flex-wrap gap-1">{user!.roles.map((r) => <Badge key={r} tone="brand">{roles[r] ?? r}</Badge>)}</dd>
        <dt className="text-muted">{d.profile.permissionsCount}</dt><dd className="num">{user!.permissions.length}</dd>
        <dt className="text-muted">{d.users.lastLogin}</dt><dd className="num">{formatDateTime(user!.lastLoginAt, locale)}</dd>
      </dl>
    </Card>
  );
}

function PasswordCard() {
  const { d } = useI18n();
  const toast = useToast();
  const [cur, setCur] = useState(""); const [pw, setPw] = useState(""); const [conf, setConf] = useState("");
  const [err, setErr] = useState<{ current?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);
  const ok = !!cur && meetsPolicy(pw) && pw === conf && pw !== cur;
  const submit = async () => {
    setBusy(true); setErr({});
    try { await authApi.changePassword({ currentPassword: cur, password: pw, passwordConfirmation: conf }); setCur(""); setPw(""); setConf(""); toast({ tone: "success", title: d.profile.passwordChanged }); }
    catch (e) {
      if (isApiError(e) && e.kind === "validation") setErr({ current: e.fieldErrors.currentPassword?.[0], password: e.fieldErrors.password?.[0] });
      else toast({ tone: "error", title: d.errors.generic });
    } finally { setBusy(false); }
  };
  return (
    <Card id="pw" title={d.profile.changePassword}>
      <form onSubmit={(e) => { e.preventDefault(); if (ok) void submit(); }} className="space-y-4" noValidate>
        <input type="text" name="username" autoComplete="username" className="hidden" readOnly value="" aria-hidden="true" tabIndex={-1} />
        <PasswordInput label={d.profile.currentPassword} autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} error={err.current} />
        <div><PasswordInput label={d.auth.newPassword} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} error={err.password} /><PasswordStrength value={pw} /></div>
        <PasswordInput label={d.auth.confirmPassword} autoComplete="new-password" value={conf} onChange={(e) => setConf(e.target.value)} error={conf && conf !== pw ? d.auth.mismatch : null} />
        <div className="flex justify-end"><Button type="submit" variant="primary" icon="key" loading={busy} disabled={!ok}>{d.profile.changePassword}</Button></div>
      </form>
    </Card>
  );
}

function TwoFactorCard() {
  const { d } = useI18n();
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState("");
  const [codes, setCodes] = useState<string[] | null>(null);
  const [disableOpen, setDisableOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  // Only <svg>/<path>/<rect> with geometric attributes survive (scripts, handlers, foreignObject… are dropped).
  const qr = useMemo(() => (setup ? sanitizeSvg(setup.qrSvg) : ""), [setup]);

  const start = async () => { setBusy("start"); try { setSetup(await authApi.enableTwoFactor()); setCode(""); setErr(null); } catch { toast({ tone: "error", title: d.errors.generic }); } finally { setBusy(null); } };
  const confirm = async (c = code) => {
    setBusy("confirm"); setErr(null);
    try { const r = await authApi.confirmTwoFactor(c); setCodes(r.recoveryCodes); setSetup(null); if (user) setUser({ ...user, twoFactorEnabled: true }); toast({ tone: "success", title: d.profile.enabledOk }); }
    catch { setErr(d.auth.invalidCode); setCode(""); } finally { setBusy(null); }
  };
  const disable = async () => {
    setBusy("disable"); setErr(null);
    try { await authApi.disableTwoFactor(pw); if (user) setUser({ ...user, twoFactorEnabled: false }); setDisableOpen(false); setPw(""); toast({ tone: "success", title: d.profile.disabledOk }); }
    catch (e) { setErr(isApiError(e) && e.kind === "validation" ? e.fieldErrors.password?.[0] ?? d.auth.invalid : d.errors.generic); } finally { setBusy(null); }
  };

  return (
    <Card id="tfa" title={d.profile.twoFactor} actions={user?.twoFactorEnabled ? <Badge tone="success" dot>{d.users.enabled}</Badge> : <Badge tone="warning" dot>{d.users.disabled}</Badge>}>
      {!setup && <>
        <p className="flex items-start gap-2 text-sm"><Icon name="shield" className={user?.twoFactorEnabled ? "mt-0.5 size-4 text-success" : "mt-0.5 size-4 text-warning"} />{user?.twoFactorEnabled ? d.profile.twoFactorOn : d.profile.twoFactorOff}</p>
        <div className="mt-4 flex justify-end">
          {user?.twoFactorEnabled ? <Button variant="ghost" className="text-danger" onClick={() => { setErr(null); setDisableOpen(true); }}>{d.profile.disable}</Button>
            : <Button variant="primary" icon="shield" loading={busy === "start"} onClick={start}>{d.profile.enable}</Button>}
        </div>
      </>}
      {setup && (
        <div className="space-y-4">
          <p className="text-sm">{d.profile.scan}</p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {qr ? <div className="size-44 shrink-0 rounded-card border border-line bg-white p-2 [&>svg]:size-full" role="img" aria-label="QR" dangerouslySetInnerHTML={{ __html: qr }} />
              : <p className="text-sm text-warning">{d.profile.qrInvalid}</p>}
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="text-xs text-muted">{d.profile.manual}</p>
                <code className="num mt-1 block select-all break-all rounded-lg bg-raised px-3 py-2 text-sm tracking-widest" dir="ltr">{setup.secret.replace(/(.{4})/g, "$1 ").trim()}</code>
              </div>
              <div>
                <p className="label">{d.profile.confirmCode}</p>
                <OtpInput value={code} onChange={setCode} onComplete={(c) => void confirm(c)} invalid={!!err} disabled={busy === "confirm"} />
                {err && <p className="error-text" role="alert">{err}</p>}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setSetup(null)}>{d.common.cancel}</Button>
            <Button variant="primary" loading={busy === "confirm"} disabled={code.length !== 6} onClick={() => void confirm()}>{d.profile.confirmEnable}</Button>
          </div>
        </div>
      )}

      <Dialog open={!!codes} onClose={() => setCodes(null)} title={d.profile.recoveryTitle} size="sm"
        footer={<>
          <Button icon="download" onClick={() => downloadText((codes ?? []).join("\n"), "withaq-admin-recovery-codes.txt", "text/plain")}>{d.profile.downloadCodes}</Button>
          <Button variant="primary" onClick={() => setCodes(null)}>{d.profile.recoveryDone}</Button>
        </>}>
        <p className="mb-3 text-sm text-muted">{d.profile.recoveryBody}</p>
        <ul className="num grid grid-cols-1 gap-1.5 rounded-lg bg-raised p-3 text-sm xs:grid-cols-2" dir="ltr">{(codes ?? []).map((c) => <li key={c} className="select-all">{c}</li>)}</ul>
      </Dialog>
      <Dialog open={disableOpen} onClose={() => setDisableOpen(false)} title={d.profile.disable} size="sm"
        footer={<><Button onClick={() => setDisableOpen(false)}>{d.common.cancel}</Button><Button variant="danger" loading={busy === "disable"} disabled={!pw} onClick={disable}>{d.profile.disable}</Button></>}>
        <p className="mb-3 text-sm">{d.profile.disableBody}</p>
        <PasswordInput label={d.auth.password} autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} error={err} data-autofocus />
      </Dialog>
    </Card>
  );
}

function SessionsCard() {
  const { d, locale } = useI18n();
  const toast = useToast();
  const { data, loading, setData } = useAsync(() => authApi.sessions(), []);
  const [busy, setBusy] = useState<string | null>(null);
  const revoke = async (id: string) => {
    setBusy(id);
    try { await authApi.revokeSession(id); setData((data ?? []).filter((s) => s.id !== id)); toast({ tone: "success", title: d.profile.revoked }); }
    catch { toast({ tone: "error", title: d.errors.generic }); } finally { setBusy(null); }
  };
  return (
    <Card id="sess" title={d.profile.sessions} description={d.profile.sessionsBody} bodyClassName="p-0">
      {loading ? <div className="space-y-2 p-4"><Skeleton className="h-12" /><Skeleton className="h-12" /></div> : (
        <ul className="divide-y divide-line">
          {(data ?? []).map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-9 place-items-center rounded-lg bg-brand-100 text-brand-700"><Icon name={/iphone|android/i.test(s.userAgent) ? "mobile" : "monitor"} className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.userAgent} {s.current && <Badge tone="success" className="ms-1">{d.profile.current}</Badge>}</p>
                <p className="num truncate text-xs text-muted"><span dir="ltr">{s.ipAddress}</span> · {d.profile.lastActive}: {formatRelative(s.lastActiveAt, locale)}</p>
              </div>
              {!s.current && <Button size="sm" variant="ghost" className="text-danger" loading={busy === s.id} onClick={() => revoke(s.id)}>{d.profile.revoke}</Button>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

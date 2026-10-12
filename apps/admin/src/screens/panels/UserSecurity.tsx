"use client";

import { useState } from "react";
import type { AnyRecord, AdminUserRecord } from "@/types/admin";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { usersApi } from "@/lib/api/endpoints";
import { formatDateTime } from "@/lib/i18n/config";

export function UserSecurity({ record, onChange }: { record: AnyRecord; onChange: (r: AnyRecord) => void }) {
  const u = record as unknown as AdminUserRecord;
  const { d, f, locale } = useI18n();
  const { can } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const locked = !!u.lockedUntil && new Date(u.lockedUntil).getTime() > Date.now();

  const unlock = async () => {
    setBusy(true);
    try { await usersApi.unlock(u.id); onChange({ ...record, lockedUntil: null, failedLoginAttempts: 0 }); toast({ tone: "success", title: d.users.unlocked }); }
    catch { toast({ tone: "error", title: d.errors.generic }); } finally { setBusy(false); }
  };

  return (
    <section className="card p-4" aria-labelledby="sec-title">
      <h2 id="sec-title" className="mb-3 text-sm font-bold">{d.users.security}</h2>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 text-xs">
        <dt className="text-muted">{d.users.twoFactor}</dt>
        <dd>{u.twoFactorEnabled ? <Badge tone="success" dot>{d.users.enabled}</Badge> : <Badge tone="warning" dot>{d.users.disabled}</Badge>}</dd>
        <dt className="text-muted">{d.users.lastLogin}</dt><dd className="num">{u.lastLoginAt ? formatDateTime(u.lastLoginAt, locale) : d.users.never}</dd>
        <dt className="text-muted">{d.users.failed}</dt><dd className="num">{u.failedLoginAttempts ?? 0}</dd>
      </dl>
      {locked && (
        <div className="mt-3 rounded-lg border border-danger/30 bg-danger/5 p-2.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-danger"><Icon name="lock" className="size-3.5" />{f(d.users.lockedUntil, { time: formatDateTime(u.lockedUntil, locale) })}</p>
          {can("users.update") && <Button size="sm" icon="unlock" className="mt-2 w-full" loading={busy} onClick={unlock}>{d.users.unlock}</Button>}
        </div>
      )}
    </section>
  );
}

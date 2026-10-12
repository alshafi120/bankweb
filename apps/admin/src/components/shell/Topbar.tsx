"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Role } from "@/types/api";
import type { InboxRecord } from "@/types/admin";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Menu } from "@/components/ui/Menu";
import { Breadcrumbs } from "./Breadcrumbs";
import { useI18n } from "@/components/providers/I18nProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { authApi } from "@/lib/api/endpoints";
import { ROLES } from "@/lib/rbac";
import { DEMO } from "@/lib/env";
import { formatRelative, other } from "@/lib/i18n/config";
import { useState } from "react";

export function Topbar({ onMenu, onCommand, notifications, onReadAll }: {
  onMenu: () => void; onCommand: () => void; notifications: InboxRecord[]; onReadAll: () => void;
}) {
  const { d, locale, f } = useI18n();
  const { user, logout, setUser, can } = useAuth();
  const { theme, toggle } = useTheme();
  const toast = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const [bellOpen, setBellOpen] = useState(false);
  const switchHref = pathname.replace(/^\/(ar|en)/, `/${other(locale)}`);
  const roleLabels = d.roles as Record<string, string>;

  const switchRole = async (role: Role) => {
    try {
      const u = await authApi.demoSwitchRole(role);
      setUser(u);
      toast({ tone: "info", title: f(d.topbar.roleSwitched, { role: roleLabels[role] ?? role }) });
      router.refresh();
    } catch { toast({ tone: "error", title: d.errors.generic }); }
  };

  const initials = (user?.name ?? "?").split(/\s+/).slice(0, 2).map((p) => p[0]).join("");

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-line bg-surface/92 px-3 backdrop-blur sm:px-4">
      <Button variant="ghost" size="icon" icon="menu" onClick={onMenu} aria-label={d.nav.openMenu} className="lg:hidden" />
      <div className="min-w-0 flex-1"><Breadcrumbs /></div>

      <button type="button" onClick={onCommand} aria-label={d.topbar.command} aria-keyshortcuts="Control+K Meta+K"
        className="hidden h-9 w-56 items-center gap-2 rounded-lg border border-line bg-raised px-2.5 text-sm text-muted transition hover:border-muted/50 md:flex xl:w-72">
        <Icon name="search" className="size-4" />
        <span className="flex-1 truncate text-start">{d.topbar.command}</span>
        <kbd className="rounded border border-line bg-surface px-1.5 font-mono text-2xs">⌘K</kbd>
      </button>
      <Button variant="ghost" size="icon" icon="search" onClick={onCommand} aria-label={d.topbar.command} className="md:hidden" />

      {/* Notifications: new applications */}
      {can("applications.view") && (
        <div className="relative">
          <button type="button" onClick={() => setBellOpen((o) => !o)} aria-expanded={bellOpen} aria-haspopup="dialog"
            aria-label={`${d.topbar.notifications}${notifications.length ? ` (${notifications.length})` : ""}`}
            className="relative grid size-9 place-items-center rounded-lg text-ink/80 hover:bg-line/40">
            <Icon name="bell" />
            {notifications.length > 0 && <span className="num absolute -top-0.5 end-0 min-w-4 rounded-full bg-accent px-1 text-center text-2xs font-semibold leading-4 text-brand-900">{notifications.length}</span>}
          </button>
          {bellOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} aria-hidden="true" />
              <div role="dialog" aria-label={d.topbar.notifications} onKeyDown={(e) => { if (e.key === "Escape") setBellOpen(false); }}
                className="pop-in fixed inset-x-3 top-14 z-50 overflow-hidden rounded-xl border border-line bg-surface shadow-pop sm:absolute sm:inset-x-auto sm:end-0 sm:top-full sm:mt-1.5 sm:w-80">
                <div className="flex items-center justify-between border-b border-line px-3 py-2">
                  <p className="text-sm font-bold">{d.topbar.notifications}</p>
                  {notifications.length > 0 && <button type="button" onClick={() => { onReadAll(); setBellOpen(false); }} className="text-xs font-semibold text-brand-700 hover:underline">{d.topbar.markRead}</button>}
                </div>
                <ul className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">{d.topbar.noNotifications}</li>}
                  {notifications.slice(0, 8).map((n) => (
                    <li key={n.id}>
                      <Link href={`/${locale}/applications?open=${n.id}&tab=${n.type}`} onClick={() => setBellOpen(false)} className="flex gap-2.5 px-3 py-2.5 hover:bg-line/30">
                        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700"><Icon name={n.type === "financing" ? "financing" : n.type === "card" ? "card" : "account"} className="size-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{d.topbar.newApplication} · {(d.inbox.tabs as Record<string, string>)[n.type]}</span>
                          <span className="block truncate text-xs text-muted"><span className="num">{n.reference}</span> · {formatRelative(n.createdAt, locale)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href={`/${locale}/applications`} onClick={() => setBellOpen(false)} className="block border-t border-line px-3 py-2 text-center text-sm font-semibold text-brand-700 hover:bg-line/30">{d.topbar.viewAll}</Link>
              </div>
            </>
          )}
        </div>
      )}

      <Link href={switchHref} hrefLang={other(locale)} lang={other(locale)} aria-label={d.topbar.languageLabel}
        className="hidden h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-ink/80 hover:bg-line/40 sm:inline-flex">
        <Icon name="globe" className="size-4" />{d.topbar.language}
      </Link>
      <Button variant="ghost" size="icon" icon={theme === "dark" ? "sun" : "moon"} onClick={toggle} aria-label={theme === "dark" ? d.topbar.themeLight : d.topbar.themeDark} />

      <Menu label={d.topbar.userMenu} width="w-72"
        trigger={(p) => (
          <button type="button" {...p} aria-label={d.topbar.userMenu} className="flex items-center gap-2 rounded-lg p-1 hover:bg-line/40">
            <span className="grid size-8 place-items-center rounded-full bg-brand-900 text-xs font-bold text-white dark:bg-brand-700 dark:text-bg">{initials}</span>
            <Icon name="chevron" className="hidden size-4 text-muted sm:block" />
          </button>
        )}
        header={
          <div className="border-b border-line px-3 pb-2 pt-1.5">
            <p className="truncate text-sm font-semibold">{user?.name}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
            <p className="mt-1 flex flex-wrap gap-1">{user?.roles.map((r) => <span key={r} className="rounded-full bg-brand-100 px-2 text-2xs font-semibold leading-5 text-brand-700">{roleLabels[r]}</span>)}</p>
          </div>
        }
        items={[
          { id: "profile", label: d.topbar.profile, icon: "user", onSelect: () => router.push(`/${locale}/profile`) },
          { id: "lang", label: d.topbar.language, icon: "globe", onSelect: () => router.push(switchHref) },
          ...(DEMO ? (["divider" as const, { id: "role-head", label: <span className="text-2xs font-semibold uppercase tracking-wide text-muted">{d.topbar.switchRole}</span>, disabled: true, onSelect: () => {} }, ...ROLES.map((r) => ({
            id: `role-${r}`, label: roleLabels[r] ?? r, icon: "role" as const, onSelect: () => void switchRole(r),
            hint: user?.roles.includes(r) ? <Icon name="check" className="size-4 text-brand-700" /> : undefined,
          }))]) : []),
          "divider",
          { id: "logout", label: d.topbar.logout, icon: "logout", danger: true, onSelect: () => void logout() },
        ]} />
    </header>
  );
}

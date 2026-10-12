"use client";

import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { NAV, NAV_GROUPS } from "@/lib/nav";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { useI18n } from "@/components/providers/I18nProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { DEMO } from "@/lib/env";

export function SidebarNav({ collapsed, onNavigate, newCount }: { collapsed: boolean; onNavigate?: () => void; newCount: number }) {
  const { d, locale } = useI18n();
  const { can } = useAuth();
  const pathname = usePathname();
  const nav = d.nav as Record<string, string>;

  return (
    <nav aria-label={d.nav.main} className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-4">
      {NAV_GROUPS.map((g) => {
        const items = NAV.filter((n) => n.group === g && can(n.permission));
        if (!items.length) return null;
        return (
          <div key={g} className="mt-4 first:mt-2">
            {!collapsed && <p className="mb-1 px-2.5 text-2xs font-semibold uppercase tracking-wide text-white/45">{nav[g]}</p>}
            {collapsed && <div className="mx-3 mb-2 border-t border-white/10" aria-hidden="true" />}
            <ul className="space-y-0.5">
              {items.map((n) => {
                const href = `/${locale}${n.path}`;
                const active = n.path === "" ? pathname === `/${locale}` : pathname === href || pathname.startsWith(`${href}/`);
                const label = nav[n.key] ?? n.key;
                return (
                  <li key={n.key}>
                    <Link href={href} onClick={onNavigate} aria-current={active ? "page" : undefined} title={collapsed ? label : undefined}
                      className={clsx("group relative flex h-9 items-center gap-2.5 rounded-lg text-[13.5px] font-medium transition-colors",
                        collapsed ? "justify-center px-0" : "px-2.5",
                        active ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/[.06] hover:text-white")}>
                      {active && <span className="absolute inset-y-1.5 start-0 w-[3px] rounded-full bg-accent" aria-hidden="true" />}
                      <Icon name={n.icon} className="size-[18px]" />
                      {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
                      {n.key === "applications" && newCount > 0 && (
                        <span className={clsx("num rounded-full bg-accent px-1.5 text-2xs font-semibold leading-5 text-brand-900", collapsed && "absolute -top-0.5 end-0.5")}>{newCount}</span>
                      )}
                      {collapsed && <span className="sr-only">{label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function Sidebar({ collapsed, onToggle, newCount }: { collapsed: boolean; onToggle: () => void; newCount: number }) {
  const { d, locale } = useI18n();
  return (
    <div className={clsx("hidden shrink-0 bg-brand-900 transition-[width] duration-200 ease-bank lg:block", collapsed ? "w-[68px]" : "w-[248px]")}>
    <aside className="sticky top-0 flex h-dvh flex-col text-white">
      <div className={clsx("flex h-14 items-center border-b border-white/10", collapsed ? "justify-center" : "px-4")}>
        <Link href={`/${locale}`} aria-label={d.app.name} className="min-w-0">
          <Logo name={d.app.bank} sub={DEMO ? `${d.app.console} · ${d.app.demoBadge}` : d.app.console} light compact={collapsed} />
        </Link>
      </div>
      <SidebarNav collapsed={collapsed} newCount={newCount} />
      <div className="border-t border-white/10 p-2">
        <button type="button" onClick={onToggle} aria-label={collapsed ? d.nav.expand : d.nav.collapse} aria-expanded={!collapsed}
          className={clsx("flex h-9 w-full items-center gap-2.5 rounded-lg text-sm text-white/60 hover:bg-white/[.06] hover:text-white", collapsed ? "justify-center" : "px-2.5")}>
          <Icon name="chevronSide" className={clsx("size-4 transition-transform", collapsed ? "rtl:rotate-180" : "rotate-180 rtl:rotate-0")} />
          {!collapsed && <span>{d.nav.collapse}</span>}
        </button>
      </div>
    </aside>
    </div>
  );
}

/** < 1024px: the same nav inside an off-canvas drawer. */
export function MobileDrawer({ open, onClose, newCount }: { open: boolean; onClose: () => void; newCount: number }) {
  const { d, locale } = useI18n();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label={d.nav.main}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}>
      <div className="fade-in absolute inset-0 bg-brand-900/50" onClick={onClose} aria-hidden="true" />
      <div className="pop-in absolute inset-y-0 start-0 flex w-[min(300px,86vw)] flex-col bg-brand-900 text-white shadow-pop">
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
          <Link href={`/${locale}`} onClick={onClose}><Logo name={d.app.bank} sub={d.app.console} light /></Link>
          <button type="button" onClick={onClose} aria-label={d.nav.closeMenu} autoFocus className="grid size-9 place-items-center rounded-lg text-white/70 hover:bg-white/10">
            <Icon name="close" />
          </button>
        </div>
        <SidebarNav collapsed={false} onNavigate={onClose} newCount={newCount} />
      </div>
    </div>
  );
}

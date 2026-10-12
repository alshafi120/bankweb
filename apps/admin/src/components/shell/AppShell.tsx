"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { InboxRecord } from "@/types/admin";
import { Sidebar, MobileDrawer } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandPalette } from "./CommandPalette";
import { BreadcrumbProvider } from "./Breadcrumbs";
import { LogoMark } from "@/components/ui/Logo";
import { Spinner } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { inboxApi } from "@/lib/api/endpoints";

const COLLAPSE_KEY = "withaq-admin-sidebar";
const READ_KEY = "withaq-admin-notif-read";

/** Authenticated chrome: sidebar (drawer < 1024px), topbar, command palette, notifications polling. */
export function AppShell({ children }: { children: ReactNode }) {
  const { status, can } = useAuth();
  const { d } = useI18n();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);
  const [notifications, setNotifications] = useState<InboxRecord[]>([]);
  const [readAt, setReadAt] = useState<string>("");

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
      setReadAt(localStorage.getItem(READ_KEY) ?? "");
    } catch { /* storage blocked */ }
  }, []);

  useEffect(() => { setDrawer(false); }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((o) => !o); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const canInbox = status === "authenticated" && can("applications.view");
  const loadNotifications = useCallback(async () => {
    if (!canInbox) { setNotifications([]); return; }
    try {
      const page = await inboxApi.list("applications", { status: "new", sort: "-createdAt", perPage: 20 });
      setNotifications(page.data.filter((a) => !readAt || a.createdAt > readAt));
    } catch { /* non-critical */ }
  }, [canInbox, readAt]);

  useEffect(() => {
    void loadNotifications();
    const t = setInterval(() => void loadNotifications(), 60_000);
    return () => clearInterval(t);
  }, [loadNotifications]);

  const toggle = () => setCollapsed((c) => { try { localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1"); } catch { /* ignore */ } return !c; });
  const readAll = () => { const t = new Date().toISOString(); setReadAt(t); try { localStorage.setItem(READ_KEY, t); } catch { /* ignore */ } setNotifications([]); };

  if (status !== "authenticated") {
    return (
      <div className="grid min-h-dvh place-items-center" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-3 text-muted">
          <LogoMark className="size-10" />
          <span className="flex items-center gap-2 text-sm"><Spinner />{d.auth.checking}</span>
        </div>
      </div>
    );
  }

  return (
    <BreadcrumbProvider>
      <div className="flex min-h-dvh">
        <Sidebar collapsed={collapsed} onToggle={toggle} newCount={notifications.length} />
        <MobileDrawer open={drawer} onClose={() => setDrawer(false)} newCount={notifications.length} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenu={() => setDrawer(true)} onCommand={() => setPalette(true)} notifications={notifications} onReadAll={readAll} />
          <main id="main" tabIndex={-1} className="min-w-0 flex-1 px-3 pb-24 pt-4 outline-none sm:px-5 lg:px-6 lg:pt-5">
            {/* وسمٌ واحدٌ يكفي اللوحةَ كلَّها: كلُّ شاشةٍ تمرُّ من هنا،
                و`Motion.tsx` يُعيد المراقبةَ عند كلِّ تنقّل. */}
            <div data-reveal>{children}</div>
          </main>
        </div>
      </div>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </BreadcrumbProvider>
  );
}

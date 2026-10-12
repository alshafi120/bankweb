"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AdminUser, Permission } from "@/types/api";
import { authApi } from "@/lib/api/endpoints";
import { apiEvents } from "@/lib/api/client";
import { hasPermission } from "@/lib/rbac";
import { useI18n } from "./I18nProvider";

type Status = "loading" | "authenticated" | "unauthenticated";
interface Auth {
  user: AdminUser | null; status: Status;
  can: (permission: Permission) => boolean;
  setUser: (u: AdminUser | null) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}
const Ctx = createContext<Auth | null>(null);

const PUBLIC = /^\/(ar|en)\/(login|forgot-password|reset-password)(\/|$)/;
const IDLE_MS = 15 * 60_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AdminUser | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useI18n();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  const setUser = useCallback((u: AdminUser | null) => { setUserState(u); setStatus(u ? "authenticated" : "unauthenticated"); }, []);

  const toLogin = useCallback((expired: boolean) => {
    const current = pathRef.current;
    if (PUBLIC.test(current)) return;
    const next = encodeURIComponent(current);
    router.replace(`/${locale}/login?next=${next}${expired ? "&expired=1" : ""}`);
  }, [locale, router]);

  const refresh = useCallback(async () => {
    try { setUser(await authApi.me()); } catch { setUser(null); }
  }, [setUser]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    apiEvents.onUnauthenticated = () => { setUser(null); toLogin(true); };
    return () => { apiEvents.onUnauthenticated = () => {}; };
  }, [setUser, toLogin]);

  useEffect(() => { if (status === "unauthenticated") toLogin(false); }, [status, toLogin]);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* already gone */ }
    setUser(null);
    router.replace(`/${locale}/login`);
  }, [locale, router, setUser]);

  // 15-minute idle timeout (mirrors the server session lifetime).
  useEffect(() => {
    if (status !== "authenticated") return;
    let timer = setTimeout(() => void logout(), IDLE_MS);
    const bump = () => { clearTimeout(timer); timer = setTimeout(() => void logout(), IDLE_MS); };
    const events = ["pointerdown", "keydown", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    return () => { clearTimeout(timer); events.forEach((e) => window.removeEventListener(e, bump)); };
  }, [status, logout]);

  const value = useMemo<Auth>(() => ({
    user, status, setUser, refresh, logout, can: (p: Permission) => hasPermission(user, p),
  }), [user, status, setUser, refresh, logout]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): Auth {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}

/** `can("news.publish")` — client-side RBAC for hiding/disabling UI (the server stays the authority). */
export function useCan() { return useAuth().can; }

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Minimal data loader: { data, error, loading, reload, setData }. Ignores stale responses. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);

  const run = useCallback(async () => {
    const id = ++seq.current;
    setLoading(true); setError(null);
    try {
      const v = await fn();
      if (id === seq.current) setData(v);
    } catch (e) {
      if (id === seq.current) setError(e);
    } finally {
      if (id === seq.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { void run(); }, [run]);
  return { data, error, loading, reload: run, setData };
}

/** Warn before leaving with unsaved changes (tab close + in-app link clicks). */
export function useDirtyGuard(dirty: boolean, message: string) {
  useEffect(() => {
    if (!dirty) return;
    const onBefore = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      if (!window.confirm(message)) { e.preventDefault(); e.stopPropagation(); }
    };
    window.addEventListener("beforeunload", onBefore);
    document.addEventListener("click", onClick, true);
    return () => { window.removeEventListener("beforeunload", onBefore); document.removeEventListener("click", onClick, true); };
  }, [dirty, message]);
}

export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

/** Cached option lists for relation fields / relation columns. */
const relationCache = new Map<string, Promise<{ value: string; label: { ar: string; en: string } }[]>>();
export function loadRelation(endpoint: string, labelKey: string, valueKey = "id", fetcher: () => Promise<{ data: Record<string, unknown>[] }>) {
  const key = `${endpoint}:${labelKey}:${valueKey}`;
  if (!relationCache.has(key)) {
    relationCache.set(key, fetcher().then((p) => p.data.map((r) => {
      const l = r[labelKey];
      return { value: String(r[valueKey]), label: typeof l === "object" && l ? (l as { ar: string; en: string }) : { ar: String(l), en: String(l) } };
    })).catch((e) => { relationCache.delete(key); throw e; }));
  }
  return relationCache.get(key)!;
}
export const invalidateRelation = (endpoint: string) => { for (const k of relationCache.keys()) if (k.startsWith(`${endpoint}:`)) relationCache.delete(k); };

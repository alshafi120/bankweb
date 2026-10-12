"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "./I18nProvider";

type Tone = "success" | "error" | "info" | "warning";
interface Toast { id: number; tone: Tone; title: string; body?: string }
const Ctx = createContext<((t: Omit<Toast, "id">) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);
  const { d } = useI18n();
  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = ++seq.current;
    setToasts((all) => [...all.slice(-3), { ...t, id }]);
    setTimeout(() => dismiss(id), t.tone === "error" ? 7000 : 4000);
  }, [dismiss]);

  const icon = { success: "checkCircle", error: "xCircle", info: "info", warning: "alert" } as const;
  const color = { success: "text-success", error: "text-danger", info: "text-secondary", warning: "text-warning" };

  return (
    <Ctx.Provider value={push}>
      {children}
      <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:end-4 sm:items-end">
        {toasts.map((t) => (
          <div key={t.id} role={t.tone === "error" ? "alert" : "status"}
            className="pop-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border border-line bg-surface p-3 shadow-pop">
            <Icon name={icon[t.tone]} className={clsx("mt-0.5 size-5", color[t.tone])} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.body && <p className="mt-0.5 text-xs text-muted">{t.body}</p>}
            </div>
            <button type="button" onClick={() => dismiss(t.id)} aria-label={d.common.close} className="rounded p-0.5 text-muted hover:text-ink">
              <Icon name="close" className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast outside ToastProvider");
  return v;
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Icon } from "./Icon";

export type ToastTone = "success" | "error" | "info";
export interface ToastMessage { id: number; text: string; tone: ToastTone }

/** Hook + viewport pair: `const { toasts, show, dismiss } = useToasts()` then `<ToastViewport … />`. */
export function useToasts(timeout = 6000) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const seq = useRef(0);
  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((x) => x.id !== id)), []);
  const show = useCallback((text: string, tone: ToastTone = "info") => {
    const id = ++seq.current;
    setToasts((ts) => [...ts.slice(-2), { id, text, tone }]);
    if (timeout > 0) window.setTimeout(() => dismiss(id), timeout);
  }, [dismiss, timeout]);
  return { toasts, show, dismiss };
}

const toneClass: Record<ToastTone, string> = {
  success: "border-success/40 [&_svg]:text-success",
  error: "border-danger/40 [&_svg]:text-danger",
  info: "border-line [&_svg]:text-brand-700",
};

/** Polite live region; toasts never steal focus. Fixed to the inline-end bottom corner. */
export function ToastViewport({ toasts, onDismiss, closeLabel }: { toasts: ToastMessage[]; onDismiss: (id: number) => void; closeLabel: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div role="status" aria-live="polite" aria-atomic="false"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 grid justify-items-end gap-2 sm:inset-x-auto sm:end-4 sm:w-[380px]">
      {mounted && toasts.map((toast) => (
        <div key={toast.id} className={clsx("reveal pointer-events-auto flex w-full items-start gap-3 rounded-card border bg-surface p-4 text-sm shadow-lift", toneClass[toast.tone])}>
          <Icon name={toast.tone === "error" ? "eye" : "shield"} className="mt-0.5 size-5 shrink-0" />
          <p className="flex-1">{toast.text}</p>
          <button type="button" onClick={() => onDismiss(toast.id)} aria-label={closeLabel} className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-bg">
            <Icon name="close" className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

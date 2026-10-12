"use client";

import clsx from "clsx";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { Button } from "./Button";
import { useI18n } from "@/components/providers/I18nProvider";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Focus-trapped, Esc-closable modal rendered in a portal. `side` turns it into a drawer. */
export function Dialog({ open, onClose, title, description, children, footer, size = "md", side, labelledBy, className, hideHeader }: {
  open: boolean; onClose: () => void; title?: ReactNode; description?: ReactNode; children?: ReactNode; footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full"; side?: "end"; labelledBy?: string; className?: string; hideHeader?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const { d } = useI18n();

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const first = node?.querySelector<HTMLElement>("[data-autofocus]") ?? node?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? node)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      if (e.key === "Tab" && node) {
        const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
        if (!items.length) return;
        const a = items[0]!; const z = items[items.length - 1]!;
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; prev?.focus?.(); };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;
  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-5xl", full: "max-w-[min(1200px,100%)]" };

  return createPortal(
    <div className={clsx("fixed inset-0 z-[70] flex", side ? "justify-end" : "items-end justify-center p-0 sm:items-center sm:p-4")}>
      <div className="fade-in absolute inset-0 bg-brand-900/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelledBy ?? (title ? titleId : undefined)} tabIndex={-1}
        className={clsx(
          "pop-in relative flex max-h-[100dvh] w-full flex-col overflow-hidden bg-surface shadow-pop outline-none",
          side ? "h-full max-w-xl border-s border-line" : clsx("rounded-t-2xl sm:max-h-[90dvh] sm:rounded-2xl", widths[size]),
          className,
        )}>
        {!hideHeader && (
          <div className="flex items-start gap-3 border-b border-line px-4 py-3 sm:px-5">
            <div className="min-w-0 flex-1">
              {title && <h2 id={titleId} className="text-[15px] font-bold">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
            </div>
            <Button variant="ghost" size="iconSm" icon="close" onClick={onClose} aria-label={d.common.close} />
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-raised px-4 py-3 sm:px-5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, body, confirmLabel, tone = "danger", loading, children }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; body?: ReactNode; confirmLabel?: string; tone?: "danger" | "primary"; loading?: boolean; children?: ReactNode;
}) {
  const { d } = useI18n();
  return (
    <Dialog open={open} onClose={onClose} size="sm" title={title}
      footer={<>
        <Button onClick={onClose} data-autofocus>{d.common.cancel}</Button>
        <Button variant={tone === "danger" ? "danger" : "primary"} loading={loading} onClick={onConfirm}>{confirmLabel ?? d.common.confirm}</Button>
      </>}>
      <div className="flex gap-3">
        <span className={clsx("grid size-9 shrink-0 place-items-center rounded-full", tone === "danger" ? "bg-danger/10 text-danger" : "bg-brand-100 text-brand-700")}>
          <Icon name={tone === "danger" ? "alert" : "info"} />
        </span>
        <div className="min-w-0 text-sm text-ink/85">{body}{children}</div>
      </div>
    </Dialog>
  );
}

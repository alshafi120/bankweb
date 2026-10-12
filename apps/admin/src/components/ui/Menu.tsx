"use client";

import clsx from "clsx";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon, type AnyIcon } from "./Icon";

export interface MenuItemDef { id: string; label: ReactNode; icon?: AnyIcon; onSelect: () => void; danger?: boolean; disabled?: boolean; hint?: ReactNode }

/** Disclosure menu with roving focus. */
export function Menu({ trigger, items, align = "end", label, header, width = "w-56" }: {
  trigger: (props: { onClick: () => void; "aria-expanded": boolean; "aria-haspopup": "menu"; id: string }) => ReactNode;
  items: (MenuItemDef | "divider")[]; align?: "start" | "end"; label: string; header?: ReactNode; width?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const id = useRef(`m${Math.random().toString(36).slice(2, 8)}`).current;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); root.current?.querySelector<HTMLElement>(`#${id}`)?.focus(); }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const els = Array.from(root.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? []);
        const i = els.indexOf(document.activeElement as HTMLElement);
        els[(i + (e.key === "ArrowDown" ? 1 : -1) + els.length) % els.length]?.focus();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus());
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open, id]);

  return (
    <div ref={root} className="relative">
      {trigger({ onClick: () => setOpen((o) => !o), "aria-expanded": open, "aria-haspopup": "menu", id })}
      {open && (
        <div role="menu" aria-label={label} aria-labelledby={id}
          className={clsx("pop-in absolute top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-pop", width, align === "end" ? "end-0" : "start-0")}>
          {header}
          {items.map((it, i) => it === "divider"
            ? <div key={`d${i}`} className="my-1 border-t border-line" role="separator" />
            : (
              <button key={it.id} role="menuitem" type="button" disabled={it.disabled}
                onClick={() => { setOpen(false); it.onSelect(); }}
                className={clsx("flex w-full items-center gap-2.5 px-3 py-2 text-start text-sm transition-colors hover:bg-line/40 focus:bg-line/40 focus:outline-none disabled:opacity-40",
                  it.danger ? "text-danger" : "text-ink")}>
                {it.icon && <Icon name={it.icon} className="size-4" />}
                <span className="min-w-0 flex-1 truncate">{it.label}</span>
                {it.hint}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

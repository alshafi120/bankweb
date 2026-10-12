"use client";

import clsx from "clsx";
import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { Icon } from "./Icon";

export function Switch({ checked, onChange, label, disabled, description, id }: {
  checked: boolean; onChange: (v: boolean) => void; label?: ReactNode; disabled?: boolean; description?: ReactNode; id?: string;
}) {
  const auto = useId();
  const sid = id ?? auto;
  return (
    <div className="flex items-start gap-3">
      <button id={sid} type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
        className={clsx("relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-150 disabled:opacity-50",
          checked ? "bg-brand-700" : "bg-line")}>
        <span className={clsx("inline-block size-4 rounded-full bg-white shadow transition-transform duration-150",
          checked ? "translate-x-[18px] rtl:-translate-x-[18px]" : "translate-x-0.5 rtl:-translate-x-0.5")} />
      </button>
      {(label || description) && (
        <label htmlFor={sid} className="min-w-0 cursor-pointer">
          {label && <span className="block text-sm font-medium">{label}</span>}
          {description && <span className="block text-xs text-muted">{description}</span>}
        </label>
      )}
    </div>
  );
}

export function Checkbox({ checked, onChange, label, indeterminate, disabled, className, ariaLabel }: {
  checked: boolean; onChange: (v: boolean) => void; label?: ReactNode; indeterminate?: boolean; disabled?: boolean; className?: string; ariaLabel?: string;
}) {
  return (
    <label className={clsx("inline-flex cursor-pointer items-center gap-2 text-sm", disabled && "cursor-not-allowed opacity-50", className)}>
      <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} aria-label={ariaLabel}
        ref={(el) => { if (el) el.indeterminate = !!indeterminate; }} onChange={(e) => onChange(e.target.checked)} />
      <span aria-hidden="true" className={clsx("grid size-4 shrink-0 place-items-center rounded border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent",
        checked || indeterminate ? "border-brand-700 bg-brand-700 text-white dark:text-bg" : "border-muted/60 bg-surface")}>
        {indeterminate ? <Icon name="minus" className="size-3" /> : checked ? <Icon name="check" className="size-3" /> : null}
      </span>
      {label}
    </label>
  );
}

/** Accessible tablist with arrow-key navigation. */
export function Tabs<T extends string>({ tabs, value, onChange, className, label, size = "md" }: {
  tabs: { id: T; label: ReactNode; badge?: ReactNode; hasError?: boolean }[]; value: T; onChange: (v: T) => void; className?: string; label: string; size?: "sm" | "md";
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const rtl = document.documentElement.dir === "rtl";
    const fwd = rtl ? "ArrowLeft" : "ArrowRight"; const back = rtl ? "ArrowRight" : "ArrowLeft";
    let n = -1;
    if (e.key === fwd) n = (i + 1) % tabs.length; else if (e.key === back) n = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") n = 0; else if (e.key === "End") n = tabs.length - 1;
    if (n >= 0) { e.preventDefault(); refs.current[n]?.focus(); onChange(tabs[n]!.id); }
  };
  return (
    <div role="tablist" aria-label={label} className={clsx("scrollbar-thin flex max-w-full gap-1 overflow-x-auto border-b border-line", className)}>
      {tabs.map((t, i) => (
        <button key={t.id} ref={(el) => { refs.current[i] = el; }} role="tab" type="button" aria-selected={value === t.id} tabIndex={value === t.id ? 0 : -1}
          onKeyDown={(e) => onKey(e, i)} onClick={() => onChange(t.id)}
          className={clsx("relative -mb-px inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 font-semibold transition-colors",
            size === "sm" ? "px-2.5 py-1.5 text-sm" : "px-3 py-2 text-base",
            value === t.id ? "border-brand-700 text-brand-700" : "border-transparent text-muted hover:text-ink")}>
          {t.label}
          {t.hasError && <span className="size-1.5 rounded-full bg-danger" aria-hidden="true" />}
          {t.badge}
        </button>
      ))}
    </div>
  );
}

/** Pill-shaped segmented control (filters, view toggles). */
export function Segmented<T extends string>({ options, value, onChange, label, className }: {
  options: { id: T; label: ReactNode; icon?: ReactNode }[]; value: T; onChange: (v: T) => void; label: string; className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={clsx("inline-flex rounded-lg border border-line bg-raised p-0.5", className)}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} onClick={() => onChange(o.id)}
          className={clsx("inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold transition-colors",
            value === o.id ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink")}>
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  );
}

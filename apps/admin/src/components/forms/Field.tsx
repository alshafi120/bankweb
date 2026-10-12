"use client";

import clsx from "clsx";
import { useId, type ReactNode } from "react";
import type { Localized } from "@/types/api";
import { useI18n } from "@/components/providers/I18nProvider";
import { tl } from "@/lib/i18n/config";

/** Label + control + help + error wrapper with proper aria wiring. */
export function FieldShell({ label, required, help, error, children, htmlFor, counter, className, action }: {
  label: ReactNode; required?: boolean; help?: ReactNode; error?: string | null; children: (ids: { id: string; describedBy?: string }) => ReactNode;
  htmlFor?: string; counter?: ReactNode; className?: string; action?: ReactNode;
}) {
  const auto = useId();
  const id = htmlFor ?? auto;
  const helpId = help ? `${id}-help` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const { d } = useI18n();
  return (
    <div className={className}>
      <div className="mb-1 flex items-end justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}{required && <span className="ms-0.5 text-danger" aria-hidden="true">*</span>}
          {required && <span className="sr-only"> ({d.common.required})</span>}
        </label>
        <span className="flex items-center gap-2">{counter}{action}</span>
      </div>
      {children({ id, describedBy: [helpId, errId].filter(Boolean).join(" ") || undefined })}
      {help && !error && <p id={helpId} className="hint">{help}</p>}
      {error && <p id={errId} className="error-text" role="alert">{error}</p>}
    </div>
  );
}

export function CharCounter({ value, max }: { value: string; max: number }) {
  const { d, f } = useI18n();
  const n = [...value].length;
  return (
    <span className={clsx("num text-2xs", n > max ? "font-semibold text-warning" : "text-muted")} title={n > max ? d.form.tooLong : undefined}>
      {f(d.form.charsRecommended, { count: n, max })}
    </span>
  );
}

export const useTl = () => { const { locale } = useI18n(); return (v: Localized | undefined) => tl(v, locale); };

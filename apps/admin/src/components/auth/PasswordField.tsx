"use client";

import clsx from "clsx";
import { useId, useState, type InputHTMLAttributes } from "react";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";
import { POLICY, passwordScore } from "@/lib/password";

export function PasswordInput({ label, error, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | null }) {
  const [show, setShow] = useState(false);
  const { d } = useI18n();
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        <input id={id} type={show ? "text" : "password"} className="field pe-10" dir="ltr" aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined} {...rest} />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? d.auth.hidePassword : d.auth.showPassword} aria-pressed={show}
          className="absolute inset-y-0 end-0 grid w-10 place-items-center rounded-e-lg text-muted hover:text-ink">
          <Icon name={show ? "eyeOff" : "eye"} className="size-4" />
        </button>
      </div>
      {error && <p id={`${id}-err`} className="error-text">{error}</p>}
    </div>
  );
}

/** Strength meter + live policy checklist. */
export function PasswordStrength({ value }: { value: string }) {
  const { d } = useI18n();
  const score = passwordScore(value);
  const labels = [d.policy.weak, d.policy.weak, d.policy.fair, d.policy.good, d.policy.strong];
  const colors = ["bg-danger", "bg-danger", "bg-warning", "bg-brand-700", "bg-success"];
  const p = d.policy as Record<string, string>;
  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1" role="meter" aria-label={d.policy.strength} aria-valuemin={0} aria-valuemax={4} aria-valuenow={score} aria-valuetext={labels[score]}>
          {[1, 2, 3, 4].map((i) => <span key={i} className={clsx("h-1.5 flex-1 rounded-full transition-colors", value && score >= i ? colors[score] : "bg-line")} />)}
        </div>
        <span className="w-14 text-end text-xs font-semibold text-muted">{value ? labels[score] : ""}</span>
      </div>
      <ul aria-label={d.policy.title} className="grid gap-1 text-xs sm:grid-cols-2">
        {POLICY.map((r) => {
          const ok = r.test(value);
          return (
            <li key={r.key} className={clsx("flex items-center gap-1.5", ok ? "text-success" : "text-muted")}>
              <Icon name={ok ? "checkCircle" : "info"} className="size-3.5" />
              <span>{p[r.key]}</span>
              <span className="sr-only">{ok ? "✓" : "✗"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { useI18n } from "@/components/providers/I18nProvider";

/** 6 single-digit boxes (always LTR), paste-aware, with auto-advance. */
export function OtpInput({ value, onChange, onComplete, invalid, disabled }: {
  value: string; onChange: (v: string) => void; onComplete?: (v: string) => void; invalid?: boolean; disabled?: boolean;
}) {
  const { d, f } = useI18n();
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  const set = (next: string) => {
    const clean = next.replace(/\D/g, "").slice(0, 6);
    onChange(clean);
    if (clean.length === 6) onComplete?.(clean);
  };
  const onInput = (i: number, v: string) => {
    const ch = v.replace(/\D/g, "").slice(-1);
    const arr = digits.slice(); arr[i] = ch;
    set(arr.join(""));
    if (ch && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) { refs.current[i - 1]?.focus(); }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  };
  const onPaste = (e: ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault(); set(text); refs.current[Math.min(5, text.length)]?.focus();
  };

  return (
    <div dir="ltr" className="flex justify-between gap-2" role="group" aria-label={d.auth.code} onPaste={onPaste}>
      {digits.map((dg, i) => (
        <input key={i} ref={(el) => { refs.current[i] = el; }} value={dg} disabled={disabled} inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"}
          pattern="[0-9]*" maxLength={1} aria-label={f(d.auth.digit, { n: i + 1 })} aria-invalid={invalid || undefined}
          onChange={(e) => onInput(i, e.target.value)} onKeyDown={(e) => onKey(i, e)} onFocus={(e) => e.target.select()}
          className="field num h-12 w-full max-w-12 px-0 text-center text-xl font-semibold" />
      ))}
    </div>
  );
}

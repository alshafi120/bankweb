"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { Icon, type AnyIcon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";
import { isSafeHref, sanitizeHtml } from "@/lib/sanitize";

/**
 * Minimal rich-text editor (no external lib): contentEditable + a fixed toolbar
 * (bold / italic / link / lists / H2 / H3 / quote / clear). Output is always run through the allow-list sanitizer.
 */
export function RichText({ value, onChange, dir, label, invalid, id, readOnly }: {
  value: string; onChange: (html: string) => void; dir: "rtl" | "ltr"; label: string; invalid?: boolean; id?: string; readOnly?: boolean;
}) {
  const { d } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef<string>("");
  const [source, setSource] = useState(false);
  const r = d.form.rich;

  // Sync external value → DOM only when it really differs (keeps the caret stable while typing).
  useEffect(() => {
    if (!ref.current || source) return;
    if (value !== last.current) { ref.current.innerHTML = sanitizeHtml(value); last.current = value; }
  }, [value, source]);

  const emit = () => {
    if (!ref.current) return;
    const clean = sanitizeHtml(ref.current.innerHTML);
    last.current = clean;
    onChange(clean);
  };

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  };

  const link = () => {
    const url = window.prompt(r.linkPrompt, "https://");
    if (!url) return;
    if (!isSafeHref(url)) return;
    exec("createLink", url.trim());
  };

  const tools: { icon: AnyIcon; label: string; run: () => void; sep?: boolean }[] = [
    { icon: "bold", label: r.bold, run: () => exec("bold") },
    { icon: "italic", label: r.italic, run: () => exec("italic") },
    { icon: "link", label: r.link, run: link, sep: true },
    { icon: "h2", label: r.h2, run: () => exec("formatBlock", "<h2>") },
    { icon: "h3", label: r.h3, run: () => exec("formatBlock", "<h3>") },
    { icon: "quote", label: r.quote, run: () => exec("formatBlock", "<blockquote>"), sep: true },
    { icon: "ul", label: r.ul, run: () => exec("insertUnorderedList") },
    { icon: "ol", label: r.ol, run: () => exec("insertOrderedList"), sep: true },
    { icon: "eraser", label: r.clear, run: () => { exec("removeFormat"); exec("formatBlock", "<p>"); } },
  ];

  return (
    <div className={clsx("overflow-hidden rounded-lg border bg-surface transition-colors focus-within:border-brand-700 focus-within:ring-2 focus-within:ring-brand-700/20",
      invalid ? "border-danger" : "border-line")}>
      {!readOnly && (
        <div role="toolbar" aria-label={label} className="flex flex-wrap items-center gap-0.5 border-b border-line bg-raised px-1.5 py-1">
          {tools.map((t) => (
            <span key={t.icon} className="flex items-center">
              <button type="button" disabled={source} onMouseDown={(e) => e.preventDefault()} onClick={t.run} aria-label={t.label} title={t.label}
                className="grid size-7 place-items-center rounded-md text-ink/75 hover:bg-line/50 hover:text-ink disabled:opacity-40">
                <Icon name={t.icon} className="size-4" />
              </button>
              {t.sep && <span className="mx-1 h-4 w-px bg-line" aria-hidden="true" />}
            </span>
          ))}
          <button type="button" onClick={() => setSource((s) => !s)} aria-pressed={source}
            className={clsx("ms-auto inline-flex h-7 items-center gap-1 rounded-md px-2 text-2xs font-semibold", source ? "bg-brand-100 text-brand-700" : "text-muted hover:bg-line/50")}>
            <Icon name="code" className="size-3.5" />{r.source}
          </button>
        </div>
      )}
      {source ? (
        <textarea id={id} dir="ltr" value={value} spellCheck={false} aria-label={`${label} — HTML`}
          onChange={(e) => onChange(e.target.value)} onBlur={(e) => onChange(sanitizeHtml(e.target.value))}
          className="num block min-h-48 w-full resize-y bg-surface p-3 text-xs outline-none" />
      ) : (
        <div id={id} ref={ref} dir={dir} role="textbox" aria-multiline="true" aria-label={label} aria-invalid={invalid || undefined}
          contentEditable={!readOnly} suppressContentEditableWarning onInput={emit} onBlur={emit}
          onPaste={(e) => { e.preventDefault(); const text = e.clipboardData.getData("text/plain"); document.execCommand("insertText", false, text); }}
          className="prose-admin min-h-48 max-w-none px-3 py-2 text-base outline-none" />
      )}
    </div>
  );
}

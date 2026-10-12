"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
  }
}

const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loader: Promise<void> | null = null;

function load(nonce?: string) {
  if (window.turnstile) return Promise.resolve();
  loader ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    if (nonce) s.nonce = nonce; // allowed by the page's nonce CSP (proxy.ts adds the host on form pages)
    s.onload = () => resolve();
    s.onerror = () => { loader = null; reject(new Error("turnstile")); };
    document.head.appendChild(s);
  });
  return loader;
}

/** Cloudflare Turnstile — rendered only when the CMS provides a public site key. */
export function Turnstile({ siteKey, nonce, locale, onToken, resetSignal, label }: {
  siteKey: string; nonce?: string; locale: string; onToken: (token: string) => void; resetSignal: number; label: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    load(nonce).then(() => {
      if (cancelled || !box.current || !window.turnstile) return;
      widget.current = window.turnstile.render(box.current, {
        sitekey: siteKey, language: locale, theme: "auto",
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
    }).catch(() => onToken(""));
    return () => {
      cancelled = true;
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey, nonce, locale]);

  useEffect(() => {
    if (resetSignal && widget.current && window.turnstile) window.turnstile.reset(widget.current);
  }, [resetSignal]);

  return <div role="group" aria-label={label} ref={box} className="min-h-[65px]" />;
}

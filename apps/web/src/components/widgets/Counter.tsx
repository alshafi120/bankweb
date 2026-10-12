"use client";

import { useEffect, useRef, useState } from "react";

/** Counts up once when visible. Renders the final value on the server so no-JS and crawlers see real numbers. */
export function Counter({ value, suffix = "", locale }: { value: number; suffix?: string; locale: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  const decimals = Number.isInteger(value) ? 0 : 1;

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setShown(0);
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / 1200);
        setShown(value * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  const fmt = new Intl.NumberFormat(locale === "ar" ? "ar-YE-u-nu-latn" : "en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return <span ref={ref} className="tabular" dir="ltr">{fmt.format(shown)}{suffix}</span>;
}

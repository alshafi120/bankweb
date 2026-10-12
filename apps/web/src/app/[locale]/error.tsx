"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { errorStrings } from "@/lib/i18n/errors";

/** Error boundary for every page under [locale]. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale === "en" ? "en" : "ar";
  const c = errorStrings[locale];
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);

  return (
    <section className="container py-16 md:py-24" role="alert">
      <h1 ref={heading} tabIndex={-1} className="text-[30px] font-bold outline-none md:text-[44px]">{c.title}</h1>
      <p className="mt-4 max-w-xl text-muted">{c.body}</p>
      {error.digest && <p className="mt-3 text-sm text-muted">{c.ref}: <code dir="ltr" className="font-mono">{error.digest}</code></p>}
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 font-semibold text-brand-900 shadow-lift">{c.retry}</button>
        <Link href={`/${locale}`} className="inline-flex min-h-11 items-center rounded-full border border-line px-5 font-semibold hover:border-brand-700">{c.home}</Link>
      </div>
    </section>
  );
}

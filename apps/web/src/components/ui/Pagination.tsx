import Link from "next/link";
import clsx from "clsx";
import type { PageMeta } from "@/types/content";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { Icon } from "./Icon";

/** Server-rendered pagination (?page=N). `build(n)` returns the full href for page n. */
export function Pagination({ meta, build, dict, label }: { meta: PageMeta; build: (page: number) => string; dict: Dictionary; label: string }) {
  if (meta.lastPage <= 1) return null;
  const { currentPage: cur, lastPage: last } = meta;
  const pages = Array.from({ length: last }, (_, i) => i + 1).filter((p) => p === 1 || p === last || Math.abs(p - cur) <= 1);
  const item = "grid min-h-11 min-w-11 place-items-center rounded-full border px-3 text-sm font-semibold transition";
  return (
    <nav aria-label={label} className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {cur > 1 && <Link rel="prev" href={build(cur - 1)} className={clsx(item, "border-line hover:border-brand-700")} aria-label={dict.common.previous}><Icon name="arrow" className="size-4 rotate-180 rtl:rotate-0" /></Link>}
      {pages.map((p, i) => (
        <span key={p} className="contents">
          {i > 0 && p - pages[i - 1]! > 1 && <span className="px-1 text-muted" aria-hidden="true">…</span>}
          <Link href={build(p)} aria-current={p === cur ? "page" : undefined} aria-label={`${dict.common.page} ${p}`}
            className={clsx(item, "tabular", p === cur ? "border-brand-900 bg-brand-900 text-white" : "border-line hover:border-brand-700")}>{p}</Link>
        </span>
      ))}
      {cur < last && <Link rel="next" href={build(cur + 1)} className={clsx(item, "border-line hover:border-brand-700")} aria-label={dict.common.next}><Icon name="arrow" className="size-4" directional /></Link>}
    </nav>
  );
}

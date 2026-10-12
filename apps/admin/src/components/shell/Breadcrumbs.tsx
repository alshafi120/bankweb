"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

const Ctx = createContext<{ label: string | null; set: (l: string | null) => void }>({ label: null, set: () => {} });

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [label, set] = useState<string | null>(null);
  const pathname = usePathname();
  useEffect(() => { set(null); }, [pathname]);
  return <Ctx.Provider value={{ label, set }}>{children}</Ctx.Provider>;
}

/** Screens call this to name the current record (e.g. the article title) in the breadcrumb trail. */
export function useBreadcrumbLabel(label: string | null | undefined) {
  const { set } = useContext(Ctx);
  useEffect(() => { set(label || null); }, [label, set]);
}

export function Breadcrumbs() {
  const { d, locale } = useI18n();
  const { label } = useContext(Ctx);
  const pathname = usePathname();
  const segs = pathname.split("/").filter(Boolean).slice(1);
  const nav = d.nav as Record<string, string>;
  const crumbs: { href: string; text: string }[] = [{ href: `/${locale}`, text: d.nav.dashboard }];
  segs.forEach((s, i) => {
    const href = `/${locale}/${segs.slice(0, i + 1).join("/")}`;
    const isLast = i === segs.length - 1;
    let text = nav[s] ?? (s === "new" ? d.common.new : s === "builder" ? d.builder.title : s === "profile" ? d.nav.profile : s);
    if (/^\d+$/.test(s)) text = isLast || segs[i + 1] === "builder" ? (label ?? `#${s}`) : (label ?? `#${s}`);
    crumbs.push({ href, text });
  });

  return (
    <nav aria-label={d.nav.breadcrumbs} className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1 text-sm text-muted">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.href} className={`flex min-w-0 items-center gap-1 ${!last && i < crumbs.length - 2 ? "hidden md:flex" : ""}`}>
              {i > 0 && <Icon name="chevronSide" className="size-3.5 shrink-0 opacity-60" directional />}
              {last ? <span aria-current="page" className="truncate font-semibold text-ink">{c.text}</span>
                : <Link href={c.href} className="truncate hover:text-ink">{c.text}</Link>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

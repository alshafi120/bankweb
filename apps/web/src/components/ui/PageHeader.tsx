import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/types/content";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { href } from "@/lib/i18n/config";
import { breadcrumbJsonLd, type Crumb } from "@/lib/seo";
import { Icon } from "./Icon";
import { JsonLd } from "./JsonLd";

/** Visible breadcrumb trail + BreadcrumbList JSON-LD. The first crumb (Home) is added automatically. */
export function Breadcrumbs({ locale, dict, items }: { locale: Locale; dict: Dictionary; items: Crumb[] }) {
  const crumbs: Crumb[] = [{ label: dict.common.home, path: "/" }, ...items];
  return (
    <>
      <nav aria-label={dict.common.breadcrumb} className="text-[13px] text-muted">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
                {i > 0 && <Icon name="chevron" className="size-3.5 shrink-0 -rotate-90 rtl:rotate-90" />}
                {last || !c.path
                  ? <span aria-current={last ? "page" : undefined} className="truncate font-medium text-ink/80">{c.label}</span>
                  : <Link href={href(locale, c.path)} className="hover:text-brand-700 hover:underline">{c.label}</Link>}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(locale, crumbs)} />
    </>
  );
}

/**
 * Shared inner-page header: breadcrumbs, H1, summary and optional actions.
 * The qamariya arch appears once, as a faint outline at the inline-end edge (desktop only).
 */
export function PageHeader({ locale, dict, title, summary, crumbs, actions, eyebrow, children }: {
  locale: Locale; dict: Dictionary; title: string; summary?: string | null; crumbs: Crumb[];
  actions?: ReactNode; eyebrow?: ReactNode; children?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden border-b border-line bg-surface">
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 end-[6%] hidden h-[320px] w-[220px] rounded-arch border-[10px] border-brand-100 lg:block">
        <div className="absolute inset-x-6 bottom-6 top-10 rounded-arch border border-accent/25" />
      </div>
      <div className="container relative py-8 md:py-12">
        <Breadcrumbs locale={locale} dict={dict} items={crumbs} />
        <div className="mt-5 max-w-3xl lg:max-w-[calc(100%-300px)]">
          {eyebrow}
          <h1 className="text-[30px] font-bold leading-tight text-ink md:text-[44px]">{title}</h1>
          {summary && <p className="mt-3 text-base text-muted md:text-lg">{summary}</p>}
          {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
          {children}
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";
import { other } from "@/lib/i18n/config";
import { usePathname } from "next/navigation";

/** Split layout: jade qamariya panel + form card. */
export function AuthLayout({ title, subtitle, children, aside }: { title: string; subtitle?: string; children: ReactNode; aside?: ReactNode }) {
  const { d, locale } = useI18n();
  const pathname = usePathname();
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="qamariya-pattern relative hidden overflow-hidden bg-brand-900 p-10 text-white lg:flex lg:flex-col">
        <Logo name={d.app.bank} sub={d.app.console} light />
        <div className="mt-auto max-w-md">
          <svg viewBox="0 0 200 120" className="mb-8 h-28 w-auto" aria-hidden="true">
            <path d="M10 120V70a90 60 0 0 1 180 0v50z" fill="#fff" fillOpacity=".06" />
            <path d="M40 70a60 44 0 0 1 60-44v44z" fill="rgb(var(--accent))" fillOpacity=".8" />
            <path d="M100 26a60 44 0 0 1 60 44h-60z" fill="#7FA9D6" fillOpacity=".7" />
            <path d="M40 70h120v40H40z" fill="#fff" fillOpacity=".12" />
            <path d="M100 70v40M40 90h120" stroke="#fff" strokeOpacity=".35" strokeWidth="2" />
          </svg>
          <p className="text-[26px] font-bold leading-snug">{d.auth.subtitle}</p>
          <p className="mt-3 flex items-center gap-2 text-sm text-white/65"><Icon name="shield" className="size-4" />{d.auth.secureNote}</p>
        </div>
      </div>
      <div className="flex min-h-dvh flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <span className="lg:hidden"><Logo name={d.app.bank} sub={d.app.console} /></span>
          <Link href={pathname.replace(/^\/(ar|en)/, `/${other(locale)}`)} hrefLang={other(locale)} className="ms-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-muted hover:text-ink">
            <Icon name="globe" className="size-4" />{d.topbar.language}
          </Link>
        </div>
        <main id="main" className="flex flex-1 items-center justify-center px-4 pb-10 sm:px-6">
          <div className="w-full max-w-[400px]">
            <h1 className="text-[24px] font-bold">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
            <div className="mt-6">{children}</div>
            {aside}
          </div>
        </main>
      </div>
    </div>
  );
}

export function Alert({ tone = "danger", children }: { tone?: "danger" | "warning" | "success" | "info"; children: ReactNode }) {
  const cls = { danger: "border-danger/30 bg-danger/8 text-danger", warning: "border-warning/30 bg-warning/10 text-warning", success: "border-success/30 bg-success/10 text-success", info: "border-secondary/30 bg-secondary/8 text-secondary" }[tone];
  const icon = { danger: "alert", warning: "clock", success: "checkCircle", info: "info" } as const;
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={`mb-4 flex gap-2 rounded-lg border px-3 py-2.5 text-sm ${cls}`}>
      <Icon name={icon[tone]} className="mt-0.5 size-4" /><div className="min-w-0 flex-1 text-ink/90 dark:text-ink">{children}</div>
    </div>
  );
}

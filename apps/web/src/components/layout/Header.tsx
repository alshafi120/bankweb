"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import type { Locale } from "@/types/content";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { href } from "@/lib/i18n/config";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";

export function Header({ locale, dict, bankName, loginUrl }: { locale: Locale; dict: Dictionary; bankName: string; loginUrl: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const other: Locale = locale === "ar" ? "en" : "ar";
  const switchHref = pathname.replace(/^\/(ar|en)/, `/${other}`) || `/${other}`;
  const n = dict.nav;

  const items = [
    ["/", n.home], ["/about", n.about], ["/personal", n.personal], ["/business", n.business],
    ["/financing", n.financing], ["/digital", n.digital], ["/cards", n.cards], ["/branches", n.branches],
    ["/news", n.news], ["/contact", n.contact],
  ] as const;

  // The mobile drawer has room for a few more destinations than the desktop bar.
  const drawerItems = [...items, ["/services", dict.footer.links.services], ["/offers", dict.footer.links.offers], ["/faq", dict.footer.links.faq], ["/careers", dict.footer.links.careers]] as const;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; }, [open]);

  return (
    <header className={clsx("sticky top-0 z-40 border-b transition-colors duration-200",
      scrolled ? "border-line bg-surface/95 backdrop-blur" : "border-transparent bg-surface")}>
      <div className="container flex h-16 items-center gap-6 lg:h-[72px]">
        <Link href={href(locale, "/")} aria-label={bankName} className="shrink-0 whitespace-nowrap"><Logo name={bankName} /></Link>

        <nav aria-label={n.menu} className="hidden min-w-0 flex-1 xl:block">
          <ul className="flex items-center gap-0.5 whitespace-nowrap text-[14px] font-medium">
            {items.map(([path, label]) => {
              const active = path === "/" ? pathname === `/${locale}` : pathname.startsWith(`/${locale}${path}`);
              return (
                <li key={path}>
                  <Link href={href(locale, path)} aria-current={active ? "page" : undefined}
                    className={clsx("rounded-full px-2.5 py-2 transition hover:text-brand-700", active ? "text-brand-700" : "text-ink/80")}>
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ms-auto flex shrink-0 items-center gap-2 whitespace-nowrap">
          <Link href={switchHref} hrefLang={other} lang={other} className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-ink/80 hover:text-brand-700 sm:inline-flex">
            <Icon name="globe" className="size-4" /> {n.switchTo}
          </Link>
          <a href={loginUrl} target="_blank" rel="noopener noreferrer" className="hidden min-h-10 items-center rounded-full border border-line px-4 text-sm font-semibold hover:border-brand-700 md:inline-flex">
            {n.login}
          </a>
          <Link href={href(locale, "/apply/account")} className="hidden min-h-10 items-center rounded-full bg-accent px-4 text-sm font-semibold text-brand-900 hover:brightness-105 sm:inline-flex">
            {n.openAccount}
          </Link>
          <button type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="mobile-nav"
            className="grid size-11 place-items-center rounded-full border border-line xl:hidden" aria-label={n.menu}>
            <Icon name="menu" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div id="mobile-nav" role="dialog" aria-modal="true" aria-label={n.menu} hidden={!open}
        className="fixed inset-0 z-50 xl:hidden">
        <button className="absolute inset-0 bg-brand-900/50" aria-label={n.close} onClick={() => setOpen(false)} />
        <div className="absolute inset-y-0 end-0 flex w-[min(360px,88vw)] flex-col bg-surface shadow-2xl">
          <div className="flex h-16 items-center justify-between border-b border-line px-4">
            <Logo name={bankName} />
            <button onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-full border border-line" aria-label={n.close}><Icon name="close" /></button>
          </div>
          <ul className="flex-1 overflow-y-auto p-2">
            {drawerItems.map(([path, label]) => (
              <li key={path}><Link href={href(locale, path)} className="flex min-h-12 items-center justify-between rounded-card px-3 font-medium hover:bg-brand-100">{label}<Icon name="arrow" className="size-4 text-muted" directional /></Link></li>
            ))}
          </ul>
          <div className="grid gap-2 border-t border-line p-4">
            <Link href={href(locale, "/apply/account")} className="grid min-h-12 place-items-center rounded-full bg-accent font-semibold text-brand-900">{n.openAccount}</Link>
            <a href={loginUrl} target="_blank" rel="noopener noreferrer" className="grid min-h-12 place-items-center rounded-full border border-line font-semibold">{n.login}</a>
            <Link href={switchHref} hrefLang={other} lang={other} className="grid min-h-12 place-items-center font-semibold text-brand-700">{n.switchTo}</Link>
          </div>
        </div>
      </div>
    </header>
  );
}

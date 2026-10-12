import Link from "next/link";
import type { Locale } from "@/types/content";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { href } from "@/lib/i18n/config";
import { Icon, type AnyIcon } from "./Icon";

/** Shortcut grid used by the 404 and error screens. */
export function HelpfulLinks({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const links: [string, string, AnyIcon][] = [
    ["/", dict.nav.home, "web"], ["/accounts", dict.pages.accounts.title, "account"], ["/financing", dict.pages.financing.title, "financing"],
    ["/branches", dict.pages.branches.title, "branch"], ["/faq", dict.pages.faq.title, "support"], ["/contact", dict.pages.contact.title, "phone"],
  ];
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {links.map(([p, label, icon]) => (
        <li key={p}>
          <Link href={href(locale, p)} className="flex min-h-14 items-center gap-3 rounded-card border border-line bg-surface px-4 font-semibold transition hover:border-brand-700/50 hover:shadow-lift">
            <Icon name={icon} className="size-5 text-brand-700" />
            <span className="flex-1">{label}</span>
            <Icon name="arrow" className="size-4 text-muted" directional />
          </Link>
        </li>
      ))}
    </ul>
  );
}

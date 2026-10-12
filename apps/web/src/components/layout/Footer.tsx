import Link from "next/link";
import type { Locale, SiteSettings } from "@/types/content";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { href, t } from "@/lib/i18n/config";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";
import { SocialLinks } from "./SocialLinks";

export function Footer({ locale, dict, settings }: { locale: Locale; dict: Dictionary; settings: SiteSettings }) {
  const l = dict.footer.links;
  const groups = [
    { title: dict.footer.groups.bank, links: [["/about", l.about], ["/board", l.board], ["/executive-management", l.executives], ["/governance", l.governance], ["/reports", l.reports], ["/csr", l.csr], ["/news", l.news], ["/careers", l.careers]] },
    { title: dict.footer.groups.services, links: [["/services", l.services], ["/personal", l.personal], ["/business", l.business], ["/accounts", l.accounts], ["/financing", l.financing], ["/cards", l.cards], ["/transfers", l.transfers], ["/digital", l.digital], ["/offers", l.offers]] },
    { title: dict.footer.groups.help, links: [["/branches", l.branches], ["/atms", l.atms], ["/agents", l.agents], ["/faq", l.faq], ["/contact", l.contact], ["/complaints", l.complaints], ["/privacy", l.privacy], ["/terms", l.terms]] },
  ];

  return (
    <footer className="bg-brand-900 text-white/75">
      <div className="container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-sm">
          <Logo name={t(settings.bankName, locale)} light />
          <p className="mt-4 text-sm">{dict.footer.about}</p>
          <dl className="mt-6 grid gap-2 text-sm">
            <div className="flex items-center gap-2"><Icon name="phone" className="size-4 text-accent" /><dd dir="ltr">{settings.tollFree} · {settings.phone}</dd></div>
            <div className="flex items-center gap-2"><Icon name="mail" className="size-4 text-accent" /><dd>{settings.email}</dd></div>
            <div className="flex items-center gap-2"><Icon name="pin" className="size-4 text-accent" /><dd>{t(settings.address, locale)}</dd></div>
          </dl>
        </div>
        {groups.map((g) => (
          <nav key={g.title} aria-label={g.title}>
            <h3 className="mb-4 text-sm font-semibold text-white">{g.title}</h3>
            <ul className="grid gap-2.5 text-sm">
              {g.links.map(([p, label]) => <li key={p}><Link className="hover:text-white" href={href(locale, p!)}>{label}</Link></li>)}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-4 py-6 text-[13px] md:flex-row md:items-center md:justify-between">
          <p className="flex items-center gap-2 text-accent"><Icon name="shield" className="size-4 shrink-0" />{dict.footer.fraud}</p>
          <div className="flex items-center gap-5">
            <SocialLinks social={settings.social} />
            <span>© 2026 {t(settings.bankName, locale)}. {dict.footer.rights}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

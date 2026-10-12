import type { Metadata } from "next";
import { getLocations, getSettings } from "@/lib/api/client";
import { t } from "@/lib/i18n/config";
import { metaLocale, resolve, type LocaleParams } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon, type AnyIcon } from "@/components/ui/Icon";
import { Section } from "@/components/ui/primitives";
import { FormSection } from "@/components/forms/FormSection";
import { BranchFinder } from "@/components/widgets/BranchFinder";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await metaLocale(params);
  return pageMetadata({ locale, path: "/contact", title: dict.pages.contact.title, description: dict.pages.contact.summary });
}

export default async function ContactPage({ params }: { params: LocaleParams }) {
  const { locale, dict } = await resolve(params);
  const [settings, branches] = await Promise.all([getSettings(), getLocations("branch")]);
  const c = dict.contactPage;
  const cards: { icon: AnyIcon; label: string; value: string; href?: string; ltr?: boolean }[] = [
    { icon: "phone", label: c.tollFree, value: settings.tollFree, href: `tel:${settings.tollFree.replace(/\s/g, "")}`, ltr: true },
    { icon: "support", label: c.phone, value: settings.phone, href: `tel:${settings.phone.replace(/\s/g, "")}`, ltr: true },
    { icon: "mail", label: c.email, value: settings.email, href: `mailto:${settings.email}`, ltr: true },
    { icon: "pin", label: c.address, value: t(settings.address, locale) },
    { icon: "clock", label: c.hours, value: c.hoursValue },
  ];

  return (
    <>
      <PageHeader locale={locale} dict={dict} title={dict.pages.contact.title} summary={dict.pages.contact.summary} crumbs={[{ label: dict.pages.contact.title }]} />
      <div className="container py-10 md:py-14">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map((card) => {
            const body = (
              <>
                <span className="grid size-11 place-items-center rounded-card bg-brand-100 text-brand-700"><Icon name={card.icon} className="size-5" /></span>
                <span className="text-[13px] text-muted">{card.label}</span>
                <span className="break-words font-semibold" dir={card.ltr ? "ltr" : undefined}>{card.value}</span>
              </>
            );
            return (
              <li key={card.label}>
                {card.href
                  ? <a href={card.href} className="grid h-full content-start gap-2 rounded-card border border-line bg-surface p-5 transition hover:border-brand-700/50 hover:shadow-lift">{body}</a>
                  : <div className="grid h-full content-start gap-2 rounded-card border border-line bg-surface p-5">{body}</div>}
              </li>
            );
          })}
        </ul>
        <p className="mt-6 flex items-start gap-2 rounded-card border border-accent/40 bg-accent/10 p-4 text-sm"><Icon name="shield" className="mt-0.5 size-5 shrink-0 text-accent" />{c.lostCard}</p>

        <section aria-labelledby="callback-h" className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <h2 id="callback-h" className="text-[26px] font-bold md:text-[32px]">{c.callbackTitle}</h2>
            <p className="mt-2 text-muted">{dict.pages.apply.callback.summary}</p>
          </div>
          <FormSection kind="callback" locale={locale} dict={dict} labelledBy="callback-h" />
        </section>
      </div>
      <Section className="bg-surface">
        <h2 className="mb-8 text-[26px] font-bold md:text-[32px]">{c.mapTitle}</h2>
        <BranchFinder locations={branches} locale={locale} dict={dict} initialType="branch" />
      </Section>
    </>
  );
}

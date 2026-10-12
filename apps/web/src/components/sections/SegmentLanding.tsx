import type { Locale } from "@/types/content";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { href } from "@/lib/i18n/config";
import { getAccounts, getCards, getFinancingProducts, getHomeContent, getServices } from "@/lib/api/client";
import { filterAccounts, filterCards, filterFinancing, filterServices, type Segment } from "@/lib/segments";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/primitives";
import { sectionRegistry, type SectionType } from "./registry";

const LAYOUT: Record<Segment, SectionType[]> = {
  personal: ["services", "accounts", "financing", "cards", "digital", "faq", "cta"],
  business: ["services", "accounts", "financing", "cards", "network", "cta"],
};

/** /personal and /business: the home page's section components, fed with products filtered to the segment. */
export async function SegmentLanding({ segment, locale, dict }: { segment: Segment; locale: Locale; dict: Dictionary }) {
  const [home, services, accounts, financing, cards] = await Promise.all([getHomeContent(), getServices(), getAccounts(), getFinancingProducts(), getCards()]);
  const content = {
    ...home,
    services: filterServices(services, segment),
    accounts: filterAccounts(accounts, segment),
    financing: filterFinancing(financing, segment),
    cards: filterCards(cards, segment),
  };
  const copy = dict.pages[segment];
  return (
    <>
      <PageHeader locale={locale} dict={dict} title={copy.title} summary={copy.summary} crumbs={[{ label: copy.title }]}
        actions={<>
          <ButtonLink href={href(locale, "/apply/account")} variant="accent" arrow>{dict.nav.openAccount}</ButtonLink>
          <ButtonLink href={href(locale, "/apply/callback")} variant="ghost">{dict.pages.apply.callback.title}</ButtonLink>
        </>} />
      {LAYOUT[segment].map((type) => {
        const Section = sectionRegistry[type];
        return <Section key={type} content={content} locale={locale} dict={dict} />;
      })}
    </>
  );
}

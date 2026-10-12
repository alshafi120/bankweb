import type { ComponentType } from "react";
import type { SectionProps } from "./types";
import { Hero } from "./Hero";
import { Services, Needs } from "./ServicesAndNeeds";
import { Accounts, Financing } from "./AccountsAndFinancing";
import { Digital, Cards } from "./DigitalAndCards";
import { Network, News, Offers } from "./NetworkNewsOffers";
import { WhyUs, AppPromo, Faq, FinalCta } from "./WhyAppFaqCta";

/**
 * Page Builder registry: page_sections.type → component.
 * The CMS stores order, visibility and schedule; the page renders whatever it receives.
 */
export const sectionRegistry = {
  hero: Hero, services: Services, needs: Needs, accounts: Accounts, financing: Financing,
  digital: Digital, cards: Cards, network: Network, news: News, offers: Offers,
  why: WhyUs, app: AppPromo, faq: Faq, cta: FinalCta,
} satisfies Record<string, ComponentType<SectionProps>>;

export type SectionType = keyof typeof sectionRegistry;

export const defaultHomeLayout: SectionType[] = [
  "hero", "services", "needs", "accounts", "financing", "digital", "cards",
  "network", "news", "offers", "why", "app", "faq", "cta",
];

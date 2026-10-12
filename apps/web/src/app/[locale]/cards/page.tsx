import type { Metadata } from "next";
import { getCards, getHomeContent } from "@/lib/api/client";
import { metaLocale, resolve, type LocaleParams } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/PageHeader";
import { Cards } from "@/components/sections/DigitalAndCards";
import { Faq } from "@/components/sections/WhyAppFaqCta";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await metaLocale(params);
  return pageMetadata({ locale, path: "/cards", title: dict.pages.cards.title, description: dict.pages.cards.summary });
}

export default async function CardsPage({ params }: { params: LocaleParams }) {
  const { locale, dict } = await resolve(params);
  const [home, cards] = await Promise.all([getHomeContent(), getCards()]);
  const content = { ...home, cards };
  return (
    <>
      <PageHeader locale={locale} dict={dict} title={dict.pages.cards.title} summary={dict.pages.cards.summary} crumbs={[{ label: dict.pages.cards.title }]} />
      <Cards content={content} locale={locale} dict={dict} />
      <Faq content={content} locale={locale} dict={dict} />
    </>
  );
}

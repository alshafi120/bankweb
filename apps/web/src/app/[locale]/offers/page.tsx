import type { Metadata } from "next";
import { getHomeContent, getOffers } from "@/lib/api/client";
import { metaLocale, resolve, type LocaleParams } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/PageHeader";
import { Offers } from "@/components/sections/NetworkNewsOffers";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await metaLocale(params);
  return pageMetadata({ locale, path: "/offers", title: dict.pages.offers.title, description: dict.pages.offers.summary });
}

export default async function OffersPage({ params }: { params: LocaleParams }) {
  const { locale, dict } = await resolve(params);
  const [home, offers] = await Promise.all([getHomeContent(), getOffers()]);
  return (
    <>
      <PageHeader locale={locale} dict={dict} title={dict.pages.offers.title} summary={dict.pages.offers.summary} crumbs={[{ label: dict.pages.offers.title }]} />
      {offers.length
        ? <Offers content={{ ...home, offers }} locale={locale} dict={dict} />
        : <div className="container py-16"><p className="rounded-card border border-dashed border-line p-10 text-center text-muted">{dict.offersPage.none}</p></div>}
    </>
  );
}

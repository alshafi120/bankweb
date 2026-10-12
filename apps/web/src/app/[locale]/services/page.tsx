import type { Metadata } from "next";
import { getHomeContent, getServices } from "@/lib/api/client";
import { metaLocale, resolve, type LocaleParams } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/PageHeader";
import { Services, Needs } from "@/components/sections/ServicesAndNeeds";
import { FinalCta } from "@/components/sections/WhyAppFaqCta";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await metaLocale(params);
  return pageMetadata({ locale, path: "/services", title: dict.pages.services.title, description: dict.pages.services.summary });
}

export default async function ServicesPage({ params }: { params: LocaleParams }) {
  const { locale, dict } = await resolve(params);
  const [home, services] = await Promise.all([getHomeContent(), getServices()]);
  const content = { ...home, services };
  return (
    <>
      <PageHeader locale={locale} dict={dict} title={dict.pages.services.title} summary={dict.pages.services.summary} crumbs={[{ label: dict.pages.services.title }]} />
      <Services content={content} locale={locale} dict={dict} />
      <Needs content={content} locale={locale} dict={dict} />
      <FinalCta content={content} locale={locale} dict={dict} />
    </>
  );
}

import type { Metadata } from "next";
import { getFinancingProducts, getHomeContent } from "@/lib/api/client";
import { metaLocale, resolve, type LocaleParams } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/PageHeader";
import { Financing } from "@/components/sections/AccountsAndFinancing";
import { FinalCta } from "@/components/sections/WhyAppFaqCta";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await metaLocale(params);
  return pageMetadata({ locale, path: "/financing", title: dict.pages.financing.title, description: dict.pages.financing.summary });
}

export default async function FinancingPage({ params }: { params: LocaleParams }) {
  const { locale, dict } = await resolve(params);
  const [home, financing] = await Promise.all([getHomeContent(), getFinancingProducts()]);
  const content = { ...home, financing };
  return (
    <>
      <PageHeader locale={locale} dict={dict} title={dict.pages.financing.title} summary={dict.pages.financing.summary} crumbs={[{ label: dict.pages.financing.title }]} />
      <Financing content={content} locale={locale} dict={dict} />
      <FinalCta content={content} locale={locale} dict={dict} />
    </>
  );
}

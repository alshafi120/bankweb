import type { Metadata } from "next";
import { firstParam } from "@/lib/content";
import { metaLocale, resolve, type LocaleParams, type SearchParams } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { NetworkPage } from "@/components/network/NetworkPage";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await metaLocale(params);
  return pageMetadata({ locale, path: "/agents", title: dict.pages.agents.title, description: dict.pages.agents.summary });
}

export default async function Page({ params, searchParams }: { params: LocaleParams; searchParams: SearchParams }) {
  const { locale, dict } = await resolve(params);
  const city = firstParam((await searchParams).city).slice(0, 60);
  return <NetworkPage type="agent" locale={locale} dict={dict} city={city} />;
}

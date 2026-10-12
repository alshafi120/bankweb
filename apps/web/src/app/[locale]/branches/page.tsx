import type { Metadata } from "next";
import { firstParam } from "@/lib/content";
import { metaLocale, resolve, type LocaleParams, type SearchParams } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { NetworkPage } from "@/components/network/NetworkPage";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await metaLocale(params);
  return pageMetadata({ locale, path: "/branches", title: dict.pages.branches.title, description: dict.pages.branches.summary });
}

export default async function Page({ params, searchParams }: { params: LocaleParams; searchParams: SearchParams }) {
  const { locale, dict } = await resolve(params);
  const city = firstParam((await searchParams).city).slice(0, 60);
  return <NetworkPage type="branch" locale={locale} dict={dict} city={city} />;
}

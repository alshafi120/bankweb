import type { Metadata } from "next";
import { metaLocale, resolve, type LocaleParams } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { SegmentLanding } from "@/components/sections/SegmentLanding";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await metaLocale(params);
  return pageMetadata({ locale, path: "/business", title: dict.pages.business.title, description: dict.pages.business.summary });
}

export default async function Page({ params }: { params: LocaleParams }) {
  const { locale, dict } = await resolve(params);
  return <SegmentLanding segment="business" locale={locale} dict={dict} />;
}

import type { Metadata } from "next";
import { metaLocale, resolve, type LocaleParams } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { SegmentLanding } from "@/components/sections/SegmentLanding";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await metaLocale(params);
  return pageMetadata({ locale, path: "/personal", title: dict.pages.personal.title, description: dict.pages.personal.summary });
}

export default async function Page({ params }: { params: LocaleParams }) {
  const { locale, dict } = await resolve(params);
  return <SegmentLanding segment="personal" locale={locale} dict={dict} />;
}

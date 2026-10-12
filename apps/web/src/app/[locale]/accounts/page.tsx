import type { Metadata } from "next";
import { getAccounts, getHomeContent } from "@/lib/api/client";
import { metaLocale, resolve, type LocaleParams } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/PageHeader";
import { Accounts } from "@/components/sections/AccountsAndFinancing";
import { Faq } from "@/components/sections/WhyAppFaqCta";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await metaLocale(params);
  return pageMetadata({ locale, path: "/accounts", title: dict.pages.accounts.title, description: dict.pages.accounts.summary });
}

export default async function AccountsPage({ params }: { params: LocaleParams }) {
  const { locale, dict } = await resolve(params);
  const [home, accounts] = await Promise.all([getHomeContent(), getAccounts()]);
  const content = { ...home, accounts };
  return (
    <>
      <PageHeader locale={locale} dict={dict} title={dict.pages.accounts.title} summary={dict.pages.accounts.summary} crumbs={[{ label: dict.pages.accounts.title }]} />
      <Accounts content={content} locale={locale} dict={dict} />
      <Faq content={content} locale={locale} dict={dict} />
    </>
  );
}

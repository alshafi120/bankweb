import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAccount, getAccounts } from "@/lib/api/client";
import { formatMoney, href, t } from "@/lib/i18n/config";
import { metaLocale, resolve } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/primitives";
import { CheckList, FactsPanel, ProductDetail, SiblingLinks } from "@/components/catalog/ProductDetail";

type Params = Promise<{ locale: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const { locale } = await metaLocale(params);
  const a = await getAccount(id);
  return a ? pageMetadata({ locale, path: `/accounts/${id}`, title: t(a.name, locale), description: t(a.tagline, locale) }) : {};
}

export default async function AccountDetail({ params }: { params: Params }) {
  const { id } = await params;
  const { locale, dict } = await resolve(params);
  const [account, all] = await Promise.all([getAccount(id), getAccounts()]);
  if (!account) notFound();
  const a = dict.accounts;
  const apply = href(locale, `/apply/account?type=${account.accountType}`);

  return (
    <>
      <PageHeader locale={locale} dict={dict} title={t(account.name, locale)} summary={t(account.tagline, locale)}
        crumbs={[{ label: dict.pages.accounts.title, path: "/accounts" }, { label: t(account.name, locale) }]}
        actions={<ButtonLink href={apply} variant="accent" arrow>{dict.accountsPage.apply}</ButtonLink>} />
      <ProductDetail aside={
        <FactsPanel
          facts={[
            [a.minimum, account.minimumBalance === null ? a.noMinimum : formatMoney(account.minimumBalance, locale)],
            [dict.accountsPage.currency, account.currency === "YER" ? dict.currency : account.currency],
          ]}
          cta={<ButtonLink href={apply} variant="primary" className="w-full">{dict.accountsPage.apply}</ButtonLink>} />
      }>
        <CheckList title={a.features} items={account.features[locale]} />
        <CheckList title={a.requirements} items={account.requirements[locale]} tone="muted" />
      </ProductDetail>
      <SiblingLinks locale={locale} title={dict.accountsPage.other}
        items={all.filter((x) => x.id !== account.id).map((x) => ({ id: x.id, path: `/accounts/${x.id}`, name: t(x.name, locale), summary: t(x.tagline, locale) }))} />
    </>
  );
}

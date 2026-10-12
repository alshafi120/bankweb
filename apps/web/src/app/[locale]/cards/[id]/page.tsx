import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCard, getCards, getSettings } from "@/lib/api/client";
import { href, t } from "@/lib/i18n/config";
import { metaLocale, resolve } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/primitives";
import { CheckList, FactsPanel, ProductDetail, SiblingLinks } from "@/components/catalog/ProductDetail";
import { BankCard } from "@/components/widgets/BankCard";

type Params = Promise<{ locale: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const { locale } = await metaLocale(params);
  const c = await getCard(id);
  return c ? pageMetadata({ locale, path: `/cards/${id}`, title: t(c.name, locale), description: t(c.summary, locale) }) : {};
}

export default async function CardDetail({ params }: { params: Params }) {
  const { id } = await params;
  const { locale, dict } = await resolve(params);
  const [card, all, settings] = await Promise.all([getCard(id), getCards(), getSettings()]);
  if (!card) notFound();
  const c = dict.cardsPage;
  const apply = href(locale, `/apply/card?type=${card.id}`);

  return (
    <>
      <PageHeader locale={locale} dict={dict} title={t(card.name, locale)} summary={t(card.summary, locale)}
        crumbs={[{ label: dict.pages.cards.title, path: "/cards" }, { label: t(card.name, locale) }]}
        actions={<ButtonLink href={apply} variant="accent" arrow>{c.request}</ButtonLink>} />
      <ProductDetail aside={
        <div className="grid gap-6">
          <div className="mx-auto w-full max-w-[360px]"><BankCard card={card} bankName={t(settings.bankName, locale)} label={t(card.name, locale)} /></div>
          <FactsPanel
            facts={[[c.network, <span key="n" dir="ltr">{card.network}</span>], ...(card.fees ? [[c.fees, <span key="f" className="font-sans text-[15px] font-medium leading-relaxed">{t(card.fees, locale)}</span>] as [string, React.ReactNode]] : [])]}
            cta={<ButtonLink href={apply} variant="primary" className="w-full">{c.request}</ButtonLink>} />
        </div>
      }>
        {card.features && <CheckList title={c.features} items={card.features[locale]} />}
        {!card.features && <p className="text-muted">{t(card.summary, locale)}</p>}
      </ProductDetail>
      <SiblingLinks locale={locale} title={c.other}
        items={all.filter((x) => x.id !== card.id).map((x) => ({ id: x.id, path: `/cards/${x.id}`, name: t(x.name, locale), summary: t(x.summary, locale) }))} />
    </>
  );
}

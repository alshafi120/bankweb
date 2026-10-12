import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFinancingProduct, getFinancingProducts } from "@/lib/api/client";
import { formatMoney, formatNumber, href, t } from "@/lib/i18n/config";
import { metaLocale, resolve } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/primitives";
import { RichText } from "@/components/ui/RichText";
import { CheckList, FactsPanel, ProductDetail, SiblingLinks } from "@/components/catalog/ProductDetail";
import { FinancingCalculator } from "@/components/widgets/FinancingCalculator";

type Params = Promise<{ locale: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const { locale } = await metaLocale(params);
  const p = await getFinancingProduct(id);
  return p ? pageMetadata({ locale, path: `/financing/${id}`, title: t(p.name, locale), description: t(p.summary, locale) }) : {};
}

export default async function FinancingDetail({ params }: { params: Params }) {
  const { id } = await params;
  const { locale, dict } = await resolve(params);
  const [product, all] = await Promise.all([getFinancingProduct(id), getFinancingProducts()]);
  if (!product) notFound();
  const f = dict.financingPage;
  const products = all.some((p) => p.id === product.id) ? all : [product, ...all];
  const apply = href(locale, `/apply/financing?product=${product.id}`);

  return (
    <>
      <PageHeader locale={locale} dict={dict} title={t(product.name, locale)} summary={t(product.summary, locale)}
        crumbs={[{ label: dict.pages.financing.title, path: "/financing" }, { label: t(product.name, locale) }]}
        actions={<>
          <ButtonLink href="#calculator" variant="accent" arrow>{dict.financing.calc}</ButtonLink>
          <ButtonLink href={apply} variant="ghost">{f.apply}</ButtonLink>
        </>} />
      <ProductDetail aside={
        <FactsPanel
          facts={(() => {
            /* ما لم يُنشره البنكُ لا يُعرض رقماً — يُقال إنّه يُحدَّد بالدراسة. */
            const tbd = locale === "ar" ? "يُحدَّد وفق دراسة البنك" : "Set after the bank\u2019s assessment";
            return [
              [f.maxAmount, product.maxAmount > 0 ? formatMoney(product.maxAmount, locale) : tbd],
              [f.maxTerm, product.maxMonths > 0 ? `${formatNumber(product.maxMonths, locale)} ${dict.financing.months}` : tbd],
              [f.rate, product.annualProfitRate > 0 ? `${formatNumber(product.annualProfitRate, locale, { maximumFractionDigits: 2 })}%` : tbd],
            ] as [string, string][];
          })()}
          note={f.indicative}
          cta={<ButtonLink href={apply} variant="primary" className="w-full">{f.apply}</ButtonLink>} />
      }>
        {product.body && (
          <section>
            <h2 className="mb-4 text-xl font-bold md:text-2xl">{f.about}</h2>
            <RichText html={t(product.body, locale)} />
          </section>
        )}
        {product.requirements && <CheckList title={f.requirements} items={product.requirements[locale]} tone="muted" />}
        <section aria-label={f.calcTitle}>
          <h2 className="mb-4 text-xl font-bold md:text-2xl">{f.calcTitle}</h2>
          <FinancingCalculator products={products} locale={locale} dict={dict} initialProductId={product.id} />
        </section>
      </ProductDetail>
      <SiblingLinks locale={locale} title={f.other}
        items={all.filter((x) => x.id !== product.id).map((x) => ({ id: x.id, path: `/financing/${x.id}`, name: t(x.name, locale), summary: t(x.summary, locale) }))} />
    </>
  );
}

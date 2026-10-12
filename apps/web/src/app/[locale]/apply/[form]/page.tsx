import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCards, getFinancingProducts } from "@/lib/api/client";
import { firstParam } from "@/lib/content";
import { href, locales } from "@/lib/i18n/config";
import { ACCOUNT_TYPES, CONTACT_SUBJECTS, FINANCING_LIMITS } from "@/lib/forms/validation";
import { metaLocale, resolve, type SearchParams } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { FormSection } from "@/components/forms/FormSection";

const APPLY_FORMS = ["account", "financing", "card", "callback"] as const;
type ApplyForm = (typeof APPLY_FORMS)[number];
const isApplyForm = (v: string): v is ApplyForm => (APPLY_FORMS as readonly string[]).includes(v);

type Params = Promise<{ locale: string; form: string }>;
export const generateStaticParams = () => locales.flatMap((locale) => APPLY_FORMS.map((form) => ({ locale, form })));
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { form } = await params;
  const { locale, dict } = await metaLocale(params);
  if (!isApplyForm(form)) return {};
  const copy = dict.pages.apply[form];
  // Forms are not search landing pages (also disallowed in robots.ts)
  return { ...pageMetadata({ locale, path: `/apply/${form}`, title: copy.title, description: copy.summary }), robots: { index: false, follow: true } };
}

const intIn = (v: string, min: number, max: number) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? String(n) : undefined;
};

/** Prefill from links: ?type= (account/card/callback subject), ?product=&amount=&months= from the calculator. */
async function prefill(form: ApplyForm, sp: Record<string, string | string[] | undefined>): Promise<Record<string, string>> {
  const type = firstParam(sp.type);
  switch (form) {
    case "account":
      return (ACCOUNT_TYPES as readonly string[]).includes(type) ? { accountType: type } : {};
    case "card": {
      const cards = await getCards();
      return cards.some((c) => c.id === type) ? { cardId: type } : {};
    }
    case "callback":
      return (CONTACT_SUBJECTS as readonly string[]).includes(type) ? { subject: type } : {};
    case "financing": {
      const products = await getFinancingProducts();
      const product = products.find((p) => p.id === firstParam(sp.product));
      const out: Record<string, string> = {};
      if (product) out.financingProductId = product.id;
      const amount = intIn(firstParam(sp.amount), FINANCING_LIMITS.minAmount, product?.maxAmount ?? FINANCING_LIMITS.maxAmount);
      const months = intIn(firstParam(sp.months), FINANCING_LIMITS.minMonths, product?.maxMonths ?? FINANCING_LIMITS.maxMonths);
      if (amount) out.amount = amount;
      if (months) out.months = months;
      return out;
    }
  }
}

export default async function ApplyPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { form } = await params;
  const { locale, dict } = await resolve(params);
  if (!isApplyForm(form)) notFound();
  const copy = dict.pages.apply[form];
  const initial = await prefill(form, await searchParams);
  const steps = dict.forms.success.steps[form];

  return (
    <>
      <PageHeader locale={locale} dict={dict} title={copy.title} summary={copy.summary} crumbs={[{ label: copy.title }]} />
      <div className="container grid gap-10 py-10 md:py-14 lg:grid-cols-[1fr_340px]">
        <section aria-labelledby="form-h" className="min-w-0">
          <h2 id="form-h" className="sr-only">{copy.title}</h2>
          <FormSection kind={form} locale={locale} dict={dict} initial={initial} labelledBy="form-h" />
        </section>
        <aside className="grid content-start gap-4">
          <div className="rounded-[20px] border border-line bg-surface p-6">
            <h2 className="mb-4 font-semibold">{dict.forms.success.next}</h2>
            <ol className="grid gap-3 text-[15px]">
              {steps.map((s, i) => <li key={s} className="flex gap-3"><span className="tabular grid size-7 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">{i + 1}</span><span className="pt-0.5 text-muted">{s}</span></li>)}
            </ol>
          </div>
          <p className="flex gap-2 rounded-card bg-brand-900 p-4 text-sm text-white/85"><Icon name="shield" className="mt-0.5 size-5 shrink-0 text-accent" />{dict.footer.fraud}</p>
          <Link href={href(locale, "/contact")} className="text-sm font-semibold text-brand-700 hover:underline">{dict.pages.contact.title}</Link>
        </aside>
      </div>
    </>
  );
}

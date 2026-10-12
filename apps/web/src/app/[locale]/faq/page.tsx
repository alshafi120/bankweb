import type { Metadata } from "next";
import { getFaqGroups } from "@/lib/api/client";
import { href, t } from "@/lib/i18n/config";
import { metaLocale, resolve, type LocaleParams } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/PageHeader";
import { JsonLd } from "@/components/ui/JsonLd";
import { ButtonLink } from "@/components/ui/primitives";
import { FaqList } from "@/components/sections/FaqList";
import { FaqSearch } from "@/components/widgets/FaqSearch";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await metaLocale(params);
  return pageMetadata({ locale, path: "/faq", title: dict.pages.faq.title, description: dict.pages.faq.summary });
}

export default async function FaqPage({ params }: { params: LocaleParams }) {
  const { locale, dict } = await resolve(params);
  const groups = await getFaqGroups();
  const jsonLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: groups.flatMap((g) => g.items).map((f) => ({ "@type": "Question", name: t(f.question, locale), acceptedAnswer: { "@type": "Answer", text: t(f.answer, locale) } })),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageHeader locale={locale} dict={dict} title={dict.pages.faq.title} summary={dict.pages.faq.summary} crumbs={[{ label: dict.pages.faq.title }]} />
      <div className="container grid gap-10 py-10 md:py-14 lg:grid-cols-[280px_1fr]">
        <aside className="grid content-start gap-6 lg:sticky lg:top-24 lg:self-start">
          <FaqSearch targetId="faq-groups" label={dict.faqPage.search} placeholder={dict.faqPage.placeholder} none={dict.faqPage.none} countLabel={dict.faqPage.count} />
          <nav aria-label={dict.newsPage.categories} className="hidden lg:block">
            <ul className="grid gap-1 text-sm">
              {groups.map((g) => <li key={g.category.slug}><a href={`#${g.category.slug}`} className="block rounded-card px-3 py-2 hover:bg-brand-100 hover:text-brand-700">{t(g.category.name, locale)}</a></li>)}
            </ul>
          </nav>
        </aside>
        <div id="faq-groups" className="grid gap-10">
          {groups.map((g) => (
            <section key={g.category.slug} id={g.category.slug} data-faq-group className="scroll-mt-28" aria-labelledby={`${g.category.slug}-h`}>
              <h2 id={`${g.category.slug}-h`} className="mb-4 text-xl font-bold md:text-2xl">{t(g.category.name, locale)}</h2>
              <FaqList openFirst={false} items={g.items.map((f) => ({ id: f.id, question: t(f.question, locale), answer: t(f.answer, locale) }))} />
            </section>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] bg-brand-100/60 p-6">
            <p className="font-semibold">{dict.pages.contact.summary}</p>
            <ButtonLink href={href(locale, "/contact")} variant="primary" arrow>{dict.nav.contact}</ButtonLink>
          </div>
        </div>
      </div>
    </>
  );
}

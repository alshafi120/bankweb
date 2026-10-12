import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getJob } from "@/lib/api/client";
import { t } from "@/lib/i18n/config";
import { metaLocale, resolve } from "@/lib/page";
import { pageMetadata, siteUrl, bankName } from "@/lib/seo";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/primitives";
import { RichText } from "@/components/ui/RichText";
import { JsonLd } from "@/components/ui/JsonLd";
import { JobMeta } from "@/components/careers/JobCard";
import { CheckList } from "@/components/catalog/ProductDetail";
import { FormSection } from "@/components/forms/FormSection";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await metaLocale(params);
  const job = await getJob(slug);
  return job ? pageMetadata({ locale, path: `/careers/${slug}`, title: t(job.title, locale), description: t(job.summary, locale) }) : {};
}

const EMPLOYMENT: Record<string, string> = { full_time: "FULL_TIME", part_time: "PART_TIME", contract: "CONTRACTOR", internship: "INTERN" };

export default async function JobPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { locale, dict } = await resolve(params);
  const job = await getJob(slug);
  if (!job) notFound();
  const c = dict.careersPage;

  const jsonLd = {
    "@context": "https://schema.org", "@type": "JobPosting",
    title: t(job.title, locale), description: job.description ? t(job.description, locale) : t(job.summary, locale),
    validThrough: job.closesAt, employmentType: EMPLOYMENT[job.employmentType],
    hiringOrganization: { "@type": "Organization", name: bankName(locale), sameAs: siteUrl() },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.city.en, addressCountry: "YE" } },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageHeader locale={locale} dict={dict} title={t(job.title, locale)} summary={t(job.summary, locale)}
        crumbs={[{ label: dict.pages.careers.title, path: "/careers" }, { label: t(job.title, locale) }]}
        actions={<ButtonLink href="#apply" variant="accent" arrow>{c.apply}</ButtonLink>}>
        <div className="mt-5"><JobMeta job={job} locale={locale} dict={dict} /></div>
      </PageHeader>
      <div className="container grid gap-10 py-10 md:py-14 lg:grid-cols-[1fr_1.15fr]">
        <div className="grid min-w-0 content-start gap-10">
          {job.description && (
            <section>
              <h2 className="mb-4 text-xl font-bold md:text-2xl">{c.description}</h2>
              <RichText html={t(job.description, locale)} />
            </section>
          )}
          {job.requirements && <CheckList title={c.requirements} items={job.requirements[locale]} tone="muted" />}
        </div>
        <section id="apply" aria-labelledby="apply-h" className="min-w-0 scroll-mt-28">
          <h2 id="apply-h" className="mb-4 text-xl font-bold md:text-2xl">{c.applyTitle}</h2>
          <FormSection kind="job" locale={locale} dict={dict} hidden={{ jobSlug: job.slug }} initial={{ city: job.city.en }} labelledBy="apply-h" />
        </section>
      </div>
    </>
  );
}

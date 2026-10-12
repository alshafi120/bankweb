import type { Metadata } from "next";
import { metaLocale, resolve, type LocaleParams } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormSection } from "@/components/forms/FormSection";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await metaLocale(params);
  return pageMetadata({ locale, path: "/complaints", title: dict.pages.complaints.title, description: dict.pages.complaints.summary });
}

export default async function ComplaintsPage({ params }: { params: LocaleParams }) {
  const { locale, dict } = await resolve(params);
  const c = dict.complaintsPage;
  return (
    <>
      <PageHeader locale={locale} dict={dict} title={dict.pages.complaints.title} summary={dict.pages.complaints.summary} crumbs={[{ label: dict.pages.complaints.title }]} />
      <div className="container grid gap-10 py-10 md:py-14 lg:grid-cols-[1.6fr_1fr]">
        <section aria-labelledby="complaint-h" className="min-w-0 lg:order-1">
          <h2 id="complaint-h" className="mb-6 text-[26px] font-bold md:text-[32px]">{c.formTitle}</h2>
          <FormSection kind="complaint" locale={locale} dict={dict} labelledBy="complaint-h" />
        </section>
        <aside className="grid content-start gap-6 lg:order-2" aria-labelledby="process-h">
          <div className="rounded-[20px] border border-line bg-surface p-6">
            <h2 id="process-h" className="mb-5 text-xl font-bold">{c.processTitle}</h2>
            <ol className="relative grid gap-5 before:absolute before:inset-y-2 before:start-[13px] before:w-px before:bg-line">
              {c.steps.map(([title, body], i) => (
                <li key={title} className="relative flex gap-4">
                  <span className="tabular relative grid size-7 shrink-0 place-items-center rounded-full bg-brand-900 text-sm font-semibold text-accent">{i + 1}</span>
                  <div><h3 className="font-semibold">{title}</h3><p className="text-sm text-muted">{body}</p></div>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-[20px] bg-brand-900 p-6 text-white">
            <h2 className="mb-4 font-semibold">{c.slaTitle}</h2>
            <dl className="grid grid-cols-3 gap-3 text-center">
              {c.sla.map(([n, label]) => (
                <div key={label} className="flex flex-col-reverse gap-1 rounded-card bg-white/5 p-3">
                  <dt className="text-xs text-white/70">{label}</dt>
                  <dd className="tabular font-mono text-3xl font-semibold text-accent">{n}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm text-white/75">{c.escalation}</p>
          </div>
        </aside>
      </div>
    </>
  );
}

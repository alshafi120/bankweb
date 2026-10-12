import type { Metadata } from "next";
import { getJobs } from "@/lib/api/client";
import { firstParam } from "@/lib/content";
import { href, t } from "@/lib/i18n/config";
import { metaLocale, resolve, type LocaleParams, type SearchParams } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/PageHeader";
import { JobCard } from "@/components/careers/JobCard";
import { AutoSubmitSelect } from "@/components/widgets/AutoSubmitSelect";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await metaLocale(params);
  return pageMetadata({ locale, path: "/careers", title: dict.pages.careers.title, description: dict.pages.careers.summary });
}

/** Filters are a plain GET form (?city=&department=, English keys): works without JS and is shareable. */
export default async function CareersPage({ params, searchParams }: { params: LocaleParams; searchParams: SearchParams }) {
  const { locale, dict } = await resolve(params);
  const sp = await searchParams;
  const c = dict.careersPage;
  const jobs = await getJobs();
  const city = firstParam(sp.city);
  const department = firstParam(sp.department);

  const uniq = (key: "city" | "department") => [...new Map(jobs.map((j) => [j[key].en, t(j[key], locale)])).entries()];
  const cities = uniq("city");
  const departments = uniq("department");
  const results = jobs.filter((j) => (!city || j.city.en === city) && (!department || j.department.en === department));
  const select = "min-h-12 w-full rounded-card border border-line bg-surface px-3";

  return (
    <>
      <PageHeader locale={locale} dict={dict} title={dict.pages.careers.title} summary={dict.pages.careers.summary} crumbs={[{ label: dict.pages.careers.title }]} />
      <div className="container py-10 md:py-14">
        <form method="get" action={href(locale, "/careers")} className="mb-8 grid gap-3 rounded-[20px] border border-line bg-surface p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end md:p-5" role="search" aria-label={c.filter}>
          <label className="grid gap-1 text-sm font-medium">{c.city}
            <AutoSubmitSelect name="city" defaultValue={city} className={select}>
              <option value="">{c.allCities}</option>
              {cities.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </AutoSubmitSelect>
          </label>
          <label className="grid gap-1 text-sm font-medium">{c.department}
            <AutoSubmitSelect name="department" defaultValue={department} className={select}>
              <option value="">{c.allDepartments}</option>
              {departments.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </AutoSubmitSelect>
          </label>
          <button type="submit" className="min-h-12 rounded-full bg-brand-900 px-6 font-semibold text-white hover:bg-brand-700">{c.filter}</button>
        </form>

        <h2 className="mb-4 text-xl font-bold md:text-2xl">{c.open} <span className="tabular text-base font-medium text-muted">({results.length})</span></h2>
        {results.length === 0
          ? <p className="rounded-card border border-dashed border-line p-10 text-center text-muted">{c.none}</p>
          : <ul className="grid gap-4">{results.map((j) => <li key={j.id}><JobCard job={j} locale={locale} dict={dict} /></li>)}</ul>}
      </div>
    </>
  );
}

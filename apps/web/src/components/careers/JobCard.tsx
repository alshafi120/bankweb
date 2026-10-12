import Link from "next/link";
import type { Job, Locale } from "@/types/content";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatDate, href, t } from "@/lib/i18n/config";
import { Icon } from "@/components/ui/Icon";

export function JobMeta({ job, locale, dict }: { job: Job; locale: Locale; dict: Dictionary }) {
  const c = dict.careersPage;
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
      <li className="flex items-center gap-1.5"><Icon name="account" className="size-4" /><span className="sr-only">{c.department}: </span>{t(job.department, locale)}</li>
      <li className="flex items-center gap-1.5"><Icon name="pin" className="size-4" /><span className="sr-only">{c.city}: </span>{t(job.city, locale)}</li>
      <li className="flex items-center gap-1.5"><Icon name="clock" className="size-4" /><span className="sr-only">{c.type}: </span>{c.types[job.employmentType]}</li>
      <li className="flex items-center gap-1.5"><Icon name="eye" className="size-4" />{c.closes}: <time dateTime={job.closesAt}>{formatDate(job.closesAt, locale)}</time></li>
    </ul>
  );
}

export function JobCard({ job, locale, dict }: { job: Job; locale: Locale; dict: Dictionary }) {
  return (
    <article className="group relative grid gap-3 rounded-card border border-line bg-surface p-5 transition hover:border-brand-700/50 hover:shadow-lift md:grid-cols-[1fr_auto] md:items-center md:p-6"
      data-job data-city={job.city.en} data-dept={job.department.en}>
      <div className="grid gap-2">
        <h3 className="text-lg font-semibold"><Link href={href(locale, `/careers/${job.slug}`)} className="after:absolute after:inset-0 group-hover:text-brand-700">{t(job.title, locale)}</Link></h3>
        <p className="text-[15px] text-muted">{t(job.summary, locale)}</p>
        <JobMeta job={job} locale={locale} dict={dict} />
      </div>
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">{dict.careersPage.view}<Icon name="arrow" className="size-4" directional /></span>
    </article>
  );
}

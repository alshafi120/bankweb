"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { DashboardData } from "@/types/api";
import { AreaChart } from "@/components/charts/AreaChart";
import { StackedBars } from "@/components/charts/StackedBars";
import { HBars } from "@/components/charts/HBars";
import { Donut } from "@/components/charts/Donut";
import { SERIES } from "@/components/charts/useSize";
import { Icon, type AnyIcon } from "@/components/ui/Icon";
import { ErrorState, Forbidden, PageHeader, Skeleton } from "@/components/ui/States";
import { ButtonLink } from "@/components/ui/Button";
import { useI18n } from "@/components/providers/I18nProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { dashboardApi } from "@/lib/api/endpoints";
import { useAsync } from "@/lib/hooks/useAsync";
import { formatCompact, formatDate, formatNumber } from "@/lib/i18n/config";

type KpiKey = keyof DashboardData["kpis"];
const KPIS: { key: KpiKey; icon: AnyIcon; href?: string; perm?: string }[] = [
  { key: "visitors", icon: "chart" },
  { key: "applications", icon: "inbox", href: "/applications", perm: "applications.view" },
  { key: "accountRequests", icon: "account", href: "/applications?tab=account", perm: "applications.view" },
  { key: "financingRequests", icon: "financing", href: "/applications?tab=financing", perm: "applications.view" },
  { key: "cardRequests", icon: "card", href: "/applications?tab=card", perm: "applications.view" },
  { key: "complaints", icon: "alert", href: "/complaints", perm: "complaints.view" },
  { key: "news", icon: "news", href: "/news?status=published", perm: "news.view" },
  { key: "jobs", icon: "briefcase", href: "/jobs?status=active", perm: "jobs.view" },
  { key: "branches", icon: "branch", href: "/branches?status=active", perm: "branches.view" },
];

export function DashboardScreen() {
  const { d, f, locale } = useI18n();
  const { can, user } = useAuth();
  const { data, error, loading, reload } = useAsync(() => dashboardApi.get(), []);

  if (!can("dashboard.view")) {
    return (
      <div>
        <PageHeader title={f(d.dashboard.greeting, { name: user?.name ?? "" })} subtitle={d.dashboard.noAccess} />
        <Forbidden />
      </div>
    );
  }

  const k = d.dashboard.kpi as Record<KpiKey, string>;
  const series = [
    { key: "account" as const, label: d.dashboard.account, color: SERIES[0]! },
    { key: "financing" as const, label: d.dashboard.financing, color: SERIES[1]! },
    { key: "card" as const, label: d.dashboard.card, color: SERIES[2]! },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title={f(d.dashboard.greeting, { name: user?.name ?? "" })} subtitle={`${d.dashboard.subtitle} · ${formatDate(new Date().toISOString(), locale)}`}
        actions={<>
          {can("news.create") && <ButtonLink href={`/${locale}/news/new`} icon="plus">{d.nav.news}</ButtonLink>}
          {can("applications.view") && <ButtonLink href={`/${locale}/applications`} variant="primary" icon="inbox">{d.nav.applications}</ButtonLink>}
        </>} />

      {error ? <ErrorState error={error} onRetry={reload} /> : (
        <>
          <section aria-label={d.dashboard.title} className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" data-reveal-stagger>
            {KPIS.map((kp, i) => {
              const val = data?.kpis[kp.key];
              const linked = kp.href && (!kp.perm || can(kp.perm));
              const inner = (
                <>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium text-muted">{k[kp.key]}</span>
                    <span className={clsx("grid size-7 shrink-0 place-items-center rounded-md", i === 0 ? "bg-accent/15 text-accent" : "bg-brand-100 text-brand-700")}><Icon name={kp.icon} className="size-4" /></span>
                  </span>
                  {loading || val == null ? <Skeleton className="mt-2 h-7 w-20" /> : (
                    <span className="num mt-1.5 block text-[24px] font-semibold leading-none tracking-tight" title={formatNumber(val, locale)}>
                      {val >= 100_000 ? formatCompact(val, locale) : formatNumber(val, locale)}
                    </span>
                  )}
                </>
              );
              const cls = clsx("card block p-3.5 transition", i === 0 && "col-span-2 md:col-span-1", linked && "hover:-translate-y-0.5 hover:border-brand-700/40 hover:shadow-lift");
              return linked ? <Link key={kp.key} href={`/${locale}${kp.href}`} className={cls}>{inner}</Link> : <div key={kp.key} className={cls}>{inner}</div>;
            })}
          </section>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <ChartCard id="visits" title={d.dashboard.visits} subtitle={d.dashboard.visitsBody} loading={loading}
              stats={data && <MiniStats items={[[d.dashboard.avg, Math.round(data.charts.visits.reduce((s, v) => s + v.count, 0) / data.charts.visits.length)], [d.dashboard.peak, Math.max(...data.charts.visits.map((v) => v.count))]]} />}
              table={data && <DataTable head={[d.dashboard.date, d.dashboard.views]} rows={data.charts.visits.map((v) => [formatDate(v.date, locale), formatNumber(v.count, locale)])} />}>
              {data && <AreaChart data={data.charts.visits} label={d.dashboard.visits} />}
            </ChartCard>
            <ChartCard id="traffic" title={d.dashboard.traffic} loading={loading}
              table={data && <DataTable head={[d.dashboard.traffic, d.dashboard.views]} rows={data.charts.trafficSources.map((s) => [(d.dashboard.sources as Record<string, string>)[s.source] ?? s.source, formatNumber(s.count, locale)])} />}>
              {data && <Donut label={d.dashboard.traffic} data={data.charts.trafficSources.map((s, i) => ({ key: s.source, label: (d.dashboard.sources as Record<string, string>)[s.source] ?? s.source, count: s.count, color: SERIES[i % SERIES.length]! }))} />}
            </ChartCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <ChartCard id="daily" title={d.dashboard.dailyApps} subtitle={d.dashboard.dailyAppsBody} loading={loading}
              legend={<Legend items={series} />}
              table={data && <DataTable head={[d.dashboard.date, ...series.map((s) => s.label)]} rows={data.charts.dailyApplications.map((r) => [formatDate(r.date, locale), ...series.map((s) => formatNumber(r[s.key], locale))])} />}>
              {data && <StackedBars data={data.charts.dailyApplications} series={series} label={d.dashboard.dailyApps} />}
            </ChartCard>
            <ChartCard id="services" title={d.dashboard.topServices} loading={loading}>
              {data && <HBars label={d.dashboard.topServices} data={data.charts.topServices} />}
            </ChartCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <ChartCard id="pages" title={d.dashboard.topPages} loading={loading}>
              {data && <TopPages rows={data.charts.topPages} />}
            </ChartCard>
            <ChartCard id="cities" title={d.dashboard.byCity} loading={loading}>
              {data && <HBars label={d.dashboard.byCity} color="var(--c3)" data={data.charts.applicationsByCity.slice(0, 8).map((c) => ({ label: c.city, count: c.count }))} />}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}

function ChartCard({ id, title, subtitle, children, loading, table, legend, stats }: {
  id: string; title: string; subtitle?: string; children: ReactNode; loading: boolean; table?: ReactNode; legend?: ReactNode; stats?: ReactNode;
}) {
  const { d } = useI18n();
  const [asTable, setAsTable] = useState(false);
  return (
    <section className="card min-w-0" aria-labelledby={`${id}-t`}>
      <header className="flex flex-wrap items-start justify-between gap-2 px-4 pt-3.5">
        <div className="min-w-0">
          <h2 id={`${id}-t`} className="text-[15px] font-bold">{title}</h2>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {stats}
          {table && <button type="button" onClick={() => setAsTable((t) => !t)} aria-pressed={asTable} className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold text-muted hover:bg-line/40 hover:text-ink">
            <Icon name={asTable ? "chart" : "list"} className="size-3.5" />{asTable ? d.dashboard.showChart : d.dashboard.showTable}
          </button>}
        </div>
      </header>
      {legend && !asTable && <div className="px-4 pt-2">{legend}</div>}
      <div className="p-4 pt-3">{loading ? <Skeleton className="h-56 w-full" /> : asTable && table ? <div className="max-h-64 overflow-auto">{table}</div> : children}</div>
    </section>
  );
}

function Legend({ items }: { items: { key: string; label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
      {items.map((s) => <li key={s.key} className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: s.color }} aria-hidden="true" />{s.label}</li>)}
    </ul>
  );
}

function MiniStats({ items }: { items: [string, number][] }) {
  const { locale } = useI18n();
  return (
    <dl className="hidden gap-4 sm:flex">
      {items.map(([l, v]) => <div key={l} className="text-end"><dt className="text-2xs text-muted">{l}</dt><dd className="num text-sm font-semibold">{formatNumber(v, locale)}</dd></div>)}
    </dl>
  );
}

function DataTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-surface text-xs text-muted"><tr>{head.map((h, i) => <th key={h} scope="col" className={clsx("py-1.5 font-semibold", i ? "text-end" : "text-start")}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-line">{r.map((c, j) => <td key={j} className={clsx("py-1.5", j ? "num text-end" : "")}>{c}</td>)}</tr>)}</tbody>
    </table>
  );
}

function TopPages({ rows }: { rows: { path: string; count: number }[] }) {
  const { d, locale } = useI18n();
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <table className="w-full text-sm">
      <thead className="text-xs text-muted"><tr>
        <th scope="col" className="pb-2 text-start font-semibold">{d.dashboard.path}</th>
        <th scope="col" className="w-2/5 pb-2 text-end font-semibold">{d.dashboard.views}</th>
      </tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.path} className="border-t border-line">
            <td className="max-w-0 py-2 pe-3"><span className="num block truncate text-xs" dir="ltr">{r.path}</span></td>
            <td className="py-2">
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line/50"><div className="h-full rounded-full" style={{ width: `${(r.count / max) * 100}%`, background: "var(--c1)" }} /></div>
                <span className="num w-14 text-end text-xs font-semibold">{formatNumber(r.count, locale)}</span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

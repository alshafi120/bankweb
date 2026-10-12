import Link from "next/link";
import clsx from "clsx";
import type { Locale, ServiceType } from "@/types/content";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatNumber, href, t } from "@/lib/i18n/config";
import { getLocations } from "@/lib/api/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/primitives";
import { BranchFinder } from "@/components/widgets/BranchFinder";

export const NETWORK_ROUTES: Record<ServiceType, "/branches" | "/atms" | "/agents"> = { branch: "/branches", atm: "/atms", agent: "/agents" };
const PAGE_KEY = { branch: "branches", atm: "atms", agent: "agents" } as const;

/** /branches, /atms, /agents — finder preset to one type, `?city=` preselects a city (English or Arabic name). */
export async function NetworkPage({ type, locale, dict, city }: { type: ServiceType; locale: Locale; dict: Dictionary; city: string }) {
  const locations = await getLocations(type);
  const copy = dict.pages[PAGE_KEY[type]];
  const path = NETWORK_ROUTES[type];

  const byCity = new Map<string, { label: string; count: number }>();
  for (const l of locations) {
    const key = l.city.en;
    byCity.set(key, { label: t(l.city, locale), count: (byCity.get(key)?.count ?? 0) + 1 });
  }
  const match = locations.find((l) => [l.city.en, l.city.ar].some((c) => c.toLowerCase() === city.trim().toLowerCase()));
  const activeKey = match?.city.en ?? "";

  const tabs: { type: ServiceType; label: string }[] = [
    { type: "branch", label: dict.pages.branches.title }, { type: "atm", label: dict.pages.atms.title }, { type: "agent", label: dict.pages.agents.title },
  ];

  return (
    <>
      <PageHeader locale={locale} dict={dict} title={copy.title} summary={copy.summary} crumbs={[{ label: copy.title }]}>
        <nav aria-label={dict.network.type} className="mt-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Link key={tab.type} href={href(locale, NETWORK_ROUTES[tab.type])} aria-current={tab.type === type ? "page" : undefined}
              className={clsx("inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold transition",
                tab.type === type ? "border-brand-900 bg-brand-900 text-white" : "border-line hover:border-brand-700 hover:text-brand-700")}>
              {tab.label}
            </Link>
          ))}
        </nav>
      </PageHeader>

      <Section className="!pt-10">
        <h2 className="sr-only">{dict.networkPage.finder}</h2>
        {/* key: re-mount when ?city= changes via the city links below */}
        <BranchFinder key={activeKey} locations={locations} locale={locale} dict={dict} initialType={type} initialCity={match ? t(match.city, locale) : ""} syncUrl />
      </Section>

      <section className="border-t border-line bg-surface py-12" aria-labelledby="cities-h">
        <div className="container">
          <h2 id="cities-h" className="mb-5 text-xl font-bold md:text-2xl">{dict.networkPage.cities}</h2>
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link href={href(locale, path)} aria-current={!activeKey ? "true" : undefined}
                className={clsx("inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium", !activeKey ? "border-brand-700 bg-brand-100 text-brand-700" : "border-line hover:border-brand-700")}>
                {dict.networkPage.allCities}<span className="tabular text-muted">{formatNumber(locations.length, locale)}</span>
              </Link>
            </li>
            {[...byCity.entries()].map(([key, c]) => (
              <li key={key}>
                <Link href={href(locale, `${path}?city=${encodeURIComponent(key)}`)} aria-current={key === activeKey ? "true" : undefined}
                  className={clsx("inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium", key === activeKey ? "border-brand-700 bg-brand-100 text-brand-700" : "border-line hover:border-brand-700")}>
                  {c.label}<span className="tabular text-muted">{formatNumber(c.count, locale)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

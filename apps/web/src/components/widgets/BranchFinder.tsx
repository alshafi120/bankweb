"use client";

import { useId, useMemo, useState } from "react";
import clsx from "clsx";
import type { Locale, Location, ServiceType } from "@/types/content";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { t } from "@/lib/i18n/config";
import { Icon } from "@/components/ui/Icon";

/**
 * Branch / ATM / agent finder.
 * v1 draws a lightweight SVG map (no third-party tiles, no tracking, fast on 3G).
 * The <YemenMap> can be swapped for MapLibre GL + self-hosted tiles without changing this component's API.
 */
const BOUNDS = { minLng: 42.4, maxLng: 53.3, minLat: 12.0, maxLat: 19.2 };
const W = 520, H = 340;
const project = (lng: number, lat: number) => [
  ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * W,
  H - ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * H,
] as const;

const OUTLINE: [number, number][] = [
  [42.7, 16.4], [43.2, 17.4], [43.9, 17.3], [44.6, 17.4], [46.4, 17.2], [47.0, 16.9], [47.6, 17.5], [48.8, 18.3],
  [49.2, 18.6], [52.0, 19.0], [53.1, 16.6], [52.2, 15.9], [51.3, 15.2], [49.6, 14.6], [48.7, 14.0], [47.9, 14.0],
  [46.7, 13.4], [45.6, 13.3], [45.0, 12.8], [44.3, 12.6], [43.5, 12.7], [43.2, 13.3], [42.9, 14.6], [42.7, 15.3],
];
const outlinePath = "M" + OUTLINE.map(([lng, lat]) => project(lng, lat).map((n) => n.toFixed(1)).join(",")).join("L") + "Z";

const typeColor: Record<ServiceType, string> = { branch: "rgb(var(--brand-700))", atm: "rgb(var(--accent))", agent: "rgb(var(--secondary))" };

export function BranchFinder({ locations, locale, dict, initialType = "", initialCity = "", syncUrl = false }: {
  locations: Location[]; locale: Locale; dict: Dictionary;
  /** Preset filters (e.g. /atms → "atm", ?city=Aden → "Aden"/"عدن" localised label). */
  initialType?: ServiceType | ""; initialCity?: string;
  /** Mirror the city filter into ?city= so the view is shareable (network pages only). */
  syncUrl?: boolean;
}) {
  const n = dict.network;
  const uid = useId();
  const [city, setCityState] = useState(initialCity);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ServiceType | "">(initialType);

  const setCity = (value: string) => {
    setCityState(value);
    if (!syncUrl) return;
    const url = new URL(window.location.href);
    const loc = locations.find((l) => t(l.city, locale) === value);
    if (loc) url.searchParams.set("city", loc.city.en); else url.searchParams.delete("city");
    window.history.replaceState(window.history.state, "", url);
  };
  const [selected, setSelected] = useState<string | null>(null);

  const cities = useMemo(() => [...new Set(locations.map((l) => t(l.city, locale)))], [locations, locale]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return locations.filter((l) =>
      (!city || t(l.city, locale) === city) &&
      (!type || l.type === type) &&
      (!q || [l.name, l.district, l.address].some((v) => t(v, locale).toLowerCase().includes(q))));
  }, [locations, city, query, type, locale]);

  const typeLabel: Record<ServiceType, string> = { branch: n.branch, atm: n.atm, agent: n.agent };
  const input = "min-h-12 w-full rounded-card border border-line bg-surface px-3";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
      <div className="grid content-start gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1 text-sm font-medium" htmlFor={`${uid}-c`}>{n.city}
            <select data-finder="city" id={`${uid}-c`} className={input} value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">{n.allCities}</option>
              {cities.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium" htmlFor={`${uid}-q`}>{n.area}
            <input data-finder="q" id={`${uid}-q`} className={input} value={query} onChange={(e) => setQuery(e.target.value)} type="search" autoComplete="off" />
          </label>
          <label className="grid gap-1 text-sm font-medium" htmlFor={`${uid}-t`}>{n.type}
            <select data-finder="type" id={`${uid}-t`} className={input} value={type} onChange={(e) => setType(e.target.value as ServiceType | "")}>
              <option value="">{n.all}</option>
              <option value="branch">{n.branch}</option><option value="atm">{n.atm}</option><option value="agent">{n.agent}</option>
            </select>
          </label>
        </div>

        <figure className="overflow-hidden rounded-[20px] border border-line bg-brand-100/60 p-3">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={n.mapLabel} className="h-auto w-full">
            <path d={outlinePath} fill="rgb(var(--surface))" stroke="rgb(var(--brand-700) / .35)" strokeWidth="1.5" />
            {results.map((l) => {
              const [x, y] = project(l.lng, l.lat);
              const on = selected === l.id;
              return (
                <g key={l.id} data-loc={l.id} data-type={l.type} transform={`translate(${x},${y})`} className="cursor-pointer" onClick={() => setSelected(l.id)}>
                  {on && <circle r="14" fill={typeColor[l.type]} opacity=".18" />}
                  <circle r={on ? 7 : 5.5} fill={typeColor[l.type]} stroke="rgb(var(--surface))" strokeWidth="2" />
                  <title>{t(l.name, locale)}</title>
                </g>
              );
            })}
          </svg>
          <figcaption className="flex flex-wrap gap-4 px-1 pt-2 text-xs text-muted">
            {(Object.keys(typeLabel) as ServiceType[]).map((k) => (
              <span key={k} className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: typeColor[k] }} />{typeLabel[k]}</span>
            ))}
          </figcaption>
        </figure>
      </div>

      <div className="grid content-start gap-3">
        <p className="text-sm text-muted" aria-live="polite"><span data-finder="count" className="tabular font-semibold text-ink">{results.length}</span> {n.results}</p>
        {results.length === 0 && <p className="rounded-card border border-dashed border-line p-6 text-center text-muted">{n.none}</p>}
        <ul className="grid max-h-[520px] gap-3 overflow-y-auto pe-1">
          {results.map((l) => (
            <li key={l.id} data-loc={l.id} data-type={l.type} data-city={t(l.city, locale)} data-text={[l.name, l.district, l.address].map((v) => t(v, locale)).join(" ").toLowerCase()}>
              <article onClick={() => setSelected(l.id)}
                className={clsx("grid w-full gap-2 rounded-card border bg-surface p-4 transition",
                  selected === l.id ? "border-brand-700 shadow-lift" : "border-line hover:border-brand-700/50")}>
                <span className="flex items-center justify-between gap-3">
                  <button type="button" aria-pressed={selected === l.id} className="text-start font-semibold hover:text-brand-700">{t(l.name, locale)}</button>
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ background: typeColor[l.type] }}>{typeLabel[l.type]}</span>
                </span>
                <span className="flex items-start gap-1.5 text-sm text-muted"><Icon name="pin" className="mt-1 size-4 shrink-0" />{t(l.city, locale)} — {t(l.address, locale)}</span>
                <span className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
                  <span className="flex items-center gap-1.5"><Icon name="clock" className="size-4" />{t(l.hours, locale)}</span>
                  <span className="flex items-center gap-1.5" dir="ltr"><Icon name="phone" className="size-4" />{l.phone}</span>
                </span>
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex flex-wrap gap-1.5">
                    {l.services[locale].map((s) => <span key={s} className="rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700">{s}</span>)}
                  </span>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}`} target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                    {n.directions}<Icon name="arrow" className="size-4" directional />
                  </a>
                </span>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/types/content";
import { href } from "@/lib/i18n/config";
import { Icon } from "@/components/ui/Icon";

/** Two-column product detail body: main content + sticky key-facts panel. Shared by accounts, financing and cards. */
export function ProductDetail({ children, aside }: { children: ReactNode; aside: ReactNode }) {
  return (
    <div className="container grid gap-8 py-10 md:py-14 lg:grid-cols-[1fr_360px] lg:gap-12">
      <div className="grid min-w-0 content-start gap-10">{children}</div>
      <aside className="lg:sticky lg:top-24 lg:self-start">{aside}</aside>
    </div>
  );
}

export function FactsPanel({ facts, cta, note }: { facts: [string, ReactNode][]; cta: ReactNode; note?: string }) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-line bg-surface shadow-lift">
      <dl className="divide-y divide-line">
        {facts.map(([k, v]) => (
          <div key={k} className="grid gap-0.5 px-5 py-4">
            <dt className="text-[13px] text-muted">{k}</dt>
            <dd className="tabular font-mono text-lg font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-3 border-t border-line bg-brand-100/40 p-5">
        {cta}
        {note && <p className="text-[13px] text-muted">{note}</p>}
      </div>
    </div>
  );
}

export function CheckList({ title, items, tone = "success" }: { title: string; items: string[]; tone?: "success" | "muted" }) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold md:text-2xl">{title}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((x) => (
          <li key={x} className="flex gap-3 rounded-card border border-line bg-surface p-4">
            <Icon name={tone === "success" ? "shield" : "account"} className={`mt-0.5 size-5 shrink-0 ${tone === "success" ? "text-success" : "text-brand-700"}`} />
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** "Other products" strip at the bottom of a detail page. */
export function SiblingLinks({ locale, title, items }: { locale: Locale; title: string; items: { id: string; path: string; name: string; summary: string }[] }) {
  if (!items.length) return null;
  return (
    <section className="border-t border-line bg-surface py-12">
      <div className="container">
        <h2 className="mb-6 text-xl font-bold md:text-2xl">{title}</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <li key={i.id}>
              <Link href={href(locale, i.path)} className="group flex h-full items-start justify-between gap-4 rounded-card border border-line p-5 transition hover:border-brand-700/50 hover:shadow-lift">
                <span><span className="block font-semibold group-hover:text-brand-700">{i.name}</span><span className="mt-1 block text-sm text-muted">{i.summary}</span></span>
                <Icon name="arrow" className="mt-1 size-4 shrink-0 text-brand-700" directional />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

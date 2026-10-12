"use client";

import clsx from "clsx";
import type { BlockDataMap, Localized, MediaRef } from "@/types/api";
import type { AdminPageSection } from "@/types/admin";
import { Icon } from "@/components/ui/Icon";
import { safeSrc } from "@/components/media/mediaUtils";
import { sanitizeHtml } from "@/lib/sanitize";
import { isHomeBlock } from "./blocks";
import { getDictionary } from "@/lib/i18n/dictionaries";

type Lang = "ar" | "en";
const t = (v: Localized | null | undefined, l: Lang) => v?.[l] ?? "";

/** Simplified, faithful-in-spirit rendering of each block (site tokens, qamariya touches) in the chosen language. */
export function SectionPreview({ section, lang, selected, onSelect }: { section: AdminPageSection; lang: Lang; selected: boolean; onSelect: () => void }) {
  const d = getDictionary(lang);
  const hidden = !section.isVisible;
  return (
    <div onClick={onSelect} className={clsx("relative cursor-pointer outline-offset-[-2px] transition", selected ? "outline outline-2 outline-accent" : "hover:outline hover:outline-1 hover:outline-brand-700/40", hidden && "opacity-40")}>
      {(hidden || section.startsAt || section.endsAt) && (
        <span className="absolute end-2 top-2 z-10 flex gap-1">
          {hidden && <span className="rounded bg-ink/80 px-1.5 text-2xs font-semibold leading-5 text-bg">{d.builder.hidden}</span>}
          {(section.startsAt || section.endsAt) && <span className="rounded bg-accent px-1.5 text-2xs font-semibold leading-5 text-brand-900">{d.builder.scheduledBadge}</span>}
        </span>
      )}
      <BlockBody section={section} lang={lang} />
    </div>
  );
}

function Img({ m, className }: { m: MediaRef | null | undefined; className?: string }) {
  const src = safeSrc(m?.url);
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt={m?.alt ? "" : ""} className={clsx("object-cover", className)} /> : <div className={clsx("bg-brand-100", className)} />;
}

function Heading({ v, lang }: { v: Localized | null | undefined; lang: Lang }) {
  const s = t(v, lang);
  return s ? <h3 className="mb-3 text-[17px] font-bold text-ink">{s}</h3> : null;
}

function BlockBody({ section, lang }: { section: AdminPageSection; lang: Lang }) {
  const d = getDictionary(lang);
  if (isHomeBlock(section.type)) {
    const name = (d.builder.blocks as Record<string, string>)[section.type] ?? section.type;
    const kind = section.type.slice(5);
    const dark = kind === "hero" || kind === "cta";
    return (
      <div className={clsx("px-5 py-6", dark ? "qamariya-pattern bg-brand-900 text-white" : "bg-surface")}>
        <p className={clsx("text-2xs font-semibold uppercase tracking-wide", dark ? "text-accent" : "text-brand-700")}>{lang === "ar" ? "كتلة الرئيسية" : "Home block"}</p>
        <p className="mt-0.5 text-[16px] font-bold">{name}</p>
        <div className="mt-3 grid grid-cols-3 gap-2" aria-hidden="true">
          {Array.from({ length: kind === "hero" || kind === "cta" ? 1 : 3 }, (_, i) => (
            <span key={i} className={clsx("h-10 rounded-md", dark ? "col-span-3 bg-white/10" : "bg-brand-100/70")} />
          ))}
        </div>
      </div>
    );
  }
  const data = section.data as Record<string, unknown>;
  switch (section.type) {
    case "hero": {
      const b = data as unknown as BlockDataMap["hero"];
      return (
        <div className="qamariya-pattern relative overflow-hidden bg-brand-900 px-5 py-8 text-white">
          {b.image && <Img m={b.image} className="absolute inset-0 size-full opacity-25" />}
          <div className="relative max-w-md">
            <p className="text-[22px] font-bold leading-snug">{t(b.title, lang) || "—"}</p>
            {t(b.subtitle, lang) && <p className="mt-2 text-sm text-white/75">{t(b.subtitle, lang)}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {b.primary && <span className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-brand-900">{t(b.primary.label, lang) || "…"}</span>}
              {b.secondary && <span className="rounded-full border border-white/30 px-4 py-1.5 text-xs font-semibold">{t(b.secondary.label, lang) || "…"}</span>}
            </div>
          </div>
        </div>
      );
    }
    case "text": {
      const b = data as unknown as BlockDataMap["text"];
      return <div className="bg-surface px-5 py-6"><Heading v={b.heading} lang={lang} /><div className="prose-admin text-sm text-ink/85" dangerouslySetInnerHTML={{ __html: sanitizeHtml(t(b.body, lang)) }} /></div>;
    }
    case "image": {
      const b = data as unknown as BlockDataMap["image"];
      return <figure className="bg-surface px-5 py-5"><Img m={b.image?.id ? b.image : null} className="aspect-[16/7] w-full rounded-card" />{t(b.caption, lang) && <figcaption className="mt-2 text-center text-xs text-muted">{t(b.caption, lang)}</figcaption>}</figure>;
    }
    case "cards": case "features": {
      const b = data as unknown as BlockDataMap["cards"];
      return (
        <div className="bg-bg px-5 py-6">
          <Heading v={b.heading} lang={lang} />
          <div className="grid grid-cols-2 gap-2.5">
            {(b.items ?? []).map((it, i) => (
              <div key={i} className="rounded-card border border-line bg-surface p-3">
                {it.icon && <span className="mb-2 grid size-8 place-items-center rounded-lg bg-brand-100 text-brand-700"><Icon name={it.icon} className="size-4" /></span>}
                <p className="text-sm font-semibold">{t(it.title, lang) || "—"}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted">{t(it.body, lang)}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "statistics": {
      const b = data as unknown as BlockDataMap["statistics"];
      return (
        <div className="bg-surface px-5 py-6">
          <Heading v={b.heading} lang={lang} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(b.items ?? []).map((it, i) => <div key={i}><p className="num text-[22px] font-semibold text-accent" dir="ltr">{it.value}{it.suffix}</p><p className="text-xs text-muted">{t(it.label, lang)}</p></div>)}
          </div>
        </div>
      );
    }
    case "faq": {
      const b = data as unknown as BlockDataMap["faq"];
      return (
        <div className="bg-surface px-5 py-6"><Heading v={b.heading} lang={lang} />
          <ul className="divide-y divide-line rounded-card border border-line">
            {(b.items ?? []).map((it, i) => <li key={i} className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm"><span>{t(it.question, lang) || "—"}</span><Icon name="plus" className="size-4 text-muted" /></li>)}
          </ul>
        </div>
      );
    }
    case "cta": {
      const b = data as unknown as BlockDataMap["cta"];
      return (
        <div className="qamariya-pattern bg-brand-900 px-5 py-7 text-center text-white">
          <p className="text-[19px] font-bold">{t(b.title, lang) || "—"}</p>
          {t(b.body, lang) && <p className="mt-1 text-sm text-white/75">{t(b.body, lang)}</p>}
          <span className="mt-3 inline-block rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-brand-900">{t(b.primary?.label, lang) || "…"}</span>
        </div>
      );
    }
    case "gallery": {
      const b = data as unknown as BlockDataMap["gallery"];
      return <div className="bg-surface px-5 py-6"><Heading v={b.heading} lang={lang} /><div className="grid grid-cols-3 gap-1.5">{(b.images ?? []).map((m, i) => <Img key={i} m={m} className="aspect-square w-full rounded-md" />)}{!b.images?.length && <div className="col-span-3 h-16 rounded-md bg-line/40" />}</div></div>;
    }
    case "video": {
      const b = data as unknown as BlockDataMap["video"];
      return <div className="bg-surface px-5 py-6"><Heading v={b.heading} lang={lang} /><div className="relative aspect-video overflow-hidden rounded-card bg-brand-900"><Img m={b.poster} className="absolute inset-0 size-full opacity-70" /><span className="absolute inset-0 m-auto grid size-12 place-items-center rounded-full bg-accent text-brand-900"><Icon name="play" /></span></div></div>;
    }
    case "map": {
      const b = data as unknown as BlockDataMap["map"];
      return (
        <div className="bg-surface px-5 py-6"><Heading v={b.heading} lang={lang} />
          <div className="relative h-28 overflow-hidden rounded-card bg-brand-100">
            <svg viewBox="0 0 100 50" className="absolute inset-0 size-full text-brand-700/25" preserveAspectRatio="none" aria-hidden="true"><path d="M5 22 L30 10 L60 8 L95 15 L96 32 L70 40 L40 46 L15 40 Z" fill="currentColor" /></svg>
            {[[22, 40], [48, 30], [70, 55], [35, 70], [80, 35]].map(([x, y], i) => <span key={i} className="absolute size-2.5 rounded-full border-2 border-white bg-accent" style={{ left: `${x}%`, top: `${y}%` }} />)}
            <span className="absolute bottom-2 start-2 rounded bg-surface/90 px-2 text-2xs font-semibold leading-5">{b.type ? (d.nav as Record<string, string>)[`${b.type === "branch" ? "branches" : b.type === "atm" ? "atms" : "agents"}`] : d.common.all}{b.city ? ` · ${b.city}` : ""}</span>
          </div>
        </div>
      );
    }
    case "people": {
      const b = data as unknown as BlockDataMap["people"];
      return (
        <div className="bg-surface px-5 py-6"><Heading v={b.heading} lang={lang} />
          <div className="grid grid-cols-3 gap-3">{(b.items ?? []).map((p, i) => <div key={i} className="text-center"><Img m={p.photo} className="mx-auto aspect-square w-full rounded-arch" /><p className="mt-1.5 text-xs font-semibold">{t(p.name, lang)}</p><p className="text-2xs text-muted">{t(p.role, lang)}</p></div>)}</div>
        </div>
      );
    }
    case "documents": {
      const b = data as unknown as BlockDataMap["documents"];
      return (
        <div className="bg-surface px-5 py-6"><Heading v={b.heading} lang={lang} />
          <ul className="space-y-1.5">{(b.items ?? []).map((doc, i) => <li key={i} className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-sm"><Icon name="pdf" className="size-4 text-danger" /><span className="flex-1 truncate">{t(doc.title, lang)}</span>{doc.year && <span className="num text-xs text-muted">{doc.year}</span>}<Icon name="download" className="size-4 text-muted" /></li>)}
            {!b.items?.length && <li className="text-xs text-muted">—</li>}</ul>
        </div>
      );
    }
  }
  return null;
}

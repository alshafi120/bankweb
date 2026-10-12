import { headers } from "next/headers";
import type { Locale } from "@/types/content";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { HelpfulLinks } from "@/components/ui/HelpfulLinks";

/**
 * Localised 404. not-found.tsx receives no params, so the locale comes from the path that proxy.ts forwards
 * (falls back to Arabic). The other language's heading is shown too, since a wrong link may land either way.
 */
export default async function NotFound() {
  const h = await headers();
  const path = h.get("x-pathname") ?? "";
  const locale: Locale = path.startsWith("/en") ? "en" : "ar";
  const dict = getDictionary(locale);
  const other = getDictionary(locale === "ar" ? "en" : "ar");

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute -top-10 end-[8%] hidden h-[340px] w-[240px] rounded-arch border-[10px] border-brand-100 md:block" />
      <div className="container relative py-16 md:py-24">
        <p className="tabular font-mono text-sm font-semibold text-accent">{dict.notFound.code}</p>
        <h1 className="mt-2 text-[32px] font-bold md:text-[48px]">{dict.notFound.title}</h1>
        <p lang={locale === "ar" ? "en" : "ar"} dir={locale === "ar" ? "ltr" : "rtl"} className="mt-1 text-lg text-muted">{other.notFound.title}</p>
        <p className="mb-8 mt-5 max-w-xl text-muted">{dict.notFound.body}</p>
        <HelpfulLinks locale={locale} dict={dict} />
      </div>
    </section>
  );
}

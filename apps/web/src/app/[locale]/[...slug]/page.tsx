import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/api/client";
import { formatDate, t } from "@/lib/i18n/config";
import { metaLocale, resolve } from "@/lib/page";
import { pageMetadata, type Crumb } from "@/lib/seo";
import { PageHeader } from "@/components/ui/PageHeader";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";

/**
 * CMS-driven pages (GET /pages/{slug}): about, board, executive-management, governance, csr, reports,
 * privacy, terms, transfers, digital — and any page an editor publishes later (dynamicParams stays on).
 * Static routes (accounts, news, …) take precedence over this dynamic segment.
 */
type Params = Promise<{ locale: string; slug: string[] }>;

/** Only single-segment slugs are CMS pages; deeper unmatched URLs fall through to the localised 404. */
const slugOf = (parts: string[]) => (parts.length === 1 && /^[a-z0-9-]{1,80}$/.test(parts[0]!) ? parts[0]! : null);

/** Pages that live under "About" in the breadcrumb trail. */
const ABOUT_CHILDREN = new Set(["board", "executive-management", "governance", "csr", "reports"]);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const slug = slugOf((await params).slug);
  const { locale } = await metaLocale(params);
  const page = slug ? await getPage(slug) : null;
  if (!page) return {};
  return pageMetadata({ locale, path: `/${slug}`, title: t(page.title, locale), description: page.summary ? t(page.summary, locale) : null, seo: page.seo });
}

export default async function CmsPageRoute({ params }: { params: Params }) {
  const slug = slugOf((await params).slug);
  const { locale, dict } = await resolve(params);
  if (!slug) notFound();
  const page = await getPage(slug);
  if (!page) notFound();

  const crumbs: Crumb[] = [
    ...(ABOUT_CHILDREN.has(slug) ? [{ label: dict.nav.about, path: "/about" }] : []),
    { label: t(page.title, locale) },
  ];
  const legal = slug === "privacy" || slug === "terms";

  return (
    <>
      <PageHeader locale={locale} dict={dict} title={t(page.title, locale)} summary={page.summary ? t(page.summary, locale) : null} crumbs={crumbs}>
        {legal && <p className="mt-4 text-sm text-muted">{dict.common.updated}: <time dateTime={page.updatedAt}>{formatDate(page.updatedAt, locale)}</time></p>}
      </PageHeader>
      <BlockRenderer sections={page.sections} locale={locale} dict={dict} />
    </>
  );
}

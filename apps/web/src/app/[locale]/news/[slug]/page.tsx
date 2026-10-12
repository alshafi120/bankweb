import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNews, getNewsArticle } from "@/lib/api/client";
import { formatDate, href, t } from "@/lib/i18n/config";
import { metaLocale, resolve } from "@/lib/page";
import { bankName, localePath, pageMetadata, siteUrl } from "@/lib/seo";
import { PageHeader } from "@/components/ui/PageHeader";
import { JsonLd } from "@/components/ui/JsonLd";
import { RichText } from "@/components/ui/RichText";
import { CoverArt } from "@/components/ui/CoverArt";
import { NewsCard } from "@/components/news/NewsCards";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await metaLocale(params);
  const n = await getNewsArticle(slug);
  if (!n) return {};
  return pageMetadata({ locale, path: `/news/${slug}`, title: t(n.title, locale), description: t(n.excerpt, locale), seo: n.seo, type: "article", publishedTime: n.publishedAt });
}

/** Plain https share links — no third-party scripts or iframes. */
function shareLinks(url: string, title: string) {
  const u = encodeURIComponent(url), tt = encodeURIComponent(title);
  return [
    { name: "X", href: `https://x.com/intent/post?url=${u}&text=${tt}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { name: "WhatsApp", href: `https://wa.me/?text=${tt}%20${u}` },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
  ];
}

export default async function NewsArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  const { locale, dict } = await resolve(params);
  const article = await getNewsArticle(slug);
  if (!article) notFound();

  const related = (await getNews({ category: article.categorySlug, perPage: 4 })).data.filter((n) => n.slug !== slug).slice(0, 3);
  const fallback = related.length ? [] : (await getNews({ perPage: 4 })).data.filter((n) => n.slug !== slug).slice(0, 3);
  const title = t(article.title, locale);
  const url = `${siteUrl()}${localePath(locale, `/news/${slug}`)}`;
  const categoryHref = href(locale, `/news${article.categorySlug ? `?category=${article.categorySlug}` : ""}`);

  const jsonLd = {
    "@context": "https://schema.org", "@type": "NewsArticle",
    headline: title, description: t(article.excerpt, locale), datePublished: article.publishedAt, dateModified: article.publishedAt,
    inLanguage: locale, mainEntityOfPage: url, articleSection: t(article.category, locale),
    author: { "@type": "Organization", name: article.author || bankName(locale) },
    publisher: { "@type": "Organization", name: bankName(locale) },
    ...(article.image ? { image: [article.image] } : {}),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <article>
        <PageHeader locale={locale} dict={dict} title={title} summary={t(article.excerpt, locale)}
          crumbs={[{ label: dict.pages.news.title, path: "/news" }, { label: title }]}
          eyebrow={
            <p className="mb-3 flex flex-wrap items-center gap-2 text-[13px] text-muted">
              <Link href={categoryHref} className="rounded-full bg-brand-100 px-2.5 py-0.5 font-semibold text-brand-700 hover:underline">{t(article.category, locale)}</Link>
              <time dateTime={article.publishedAt}>{formatDate(article.publishedAt, locale)}</time>
            </p>
          } />
        <div className="container grid gap-10 py-10 md:py-14 lg:grid-cols-[1fr_280px]">
          <div className="min-w-0 max-w-3xl">
            <CoverArt seed={article.id} label={t(article.category, locale)} className="mb-8 aspect-[16/9] rounded-[20px]" />
            <RichText html={t(article.content, locale)} className="text-[17px]" />
            {article.author && <p className="mt-8 text-sm text-muted">{dict.newsPage.by} {article.author}</p>}
          </div>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <h2 className="mb-3 text-sm font-semibold text-muted">{dict.newsPage.share}</h2>
            <ul className="flex flex-wrap gap-2 lg:grid">
              {shareLinks(url, title).map((s) => (
                <li key={s.name}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-full items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold hover:border-brand-700 hover:text-brand-700">
                    <span className="sr-only">{dict.newsPage.shareOn} </span><span dir="ltr">{s.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </article>

      {(related.length > 0 || fallback.length > 0) && (
        <section className="border-t border-line bg-surface py-12" aria-labelledby="related-h">
          <div className="container">
            <h2 id="related-h" className="mb-6 text-xl font-bold md:text-2xl">{dict.newsPage.related}</h2>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(related.length ? related : fallback).map((n) => <li key={n.id}><NewsCard item={n} locale={locale} /></li>)}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}

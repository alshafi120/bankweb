import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
// Self-hosted fonts (no third-party requests — better privacy, CSP font-src 'self', works offline/behind proxies)
import "@fontsource/ibm-plex-sans-arabic/arabic-400.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-500.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-600.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-700.css";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-sans/latin-700.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-600.css";
import "../globals.css";
import { dirOf, isLocale, locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getSettings } from "@/lib/api/client";
import { PageViewBeacon } from "@/components/widgets/PageViewBeacon";
import { ServiceWorker } from "@/components/widgets/ServiceWorker";
import { Motion } from "@/components/widgets/Motion";
import { Parallax } from "@/components/widgets/Parallax";
import { TopBar } from "@/components/layout/TopBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { t } from "@/lib/i18n/config";


export const generateStaticParams = () => locales.map((locale) => ({ locale }));

export const viewport: Viewport = { themeColor: "#283870", width: "device-width", initialScale: 1 };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDictionary(locale);
  const site = process.env.SITE_URL ?? "http://localhost:3000";
  return {
    metadataBase: new URL(site),
    title: { default: d.meta.title, template: `%s | ${locale === "ar" ? "بنك وثاق" : "Withaq Bank"}` },
    description: d.meta.description,
    alternates: { canonical: `/${locale}`, languages: { ar: "/ar", en: "/en", "x-default": "/ar" } },
    openGraph: { type: "website", locale: locale === "ar" ? "ar_YE" : "en_US", siteName: d.meta.title, title: d.meta.title, description: d.meta.description },
    twitter: { card: "summary_large_image", title: d.meta.title, description: d.meta.description },
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: locale === "ar" ? "بنك وثاق" : "Withaq Bank" },
    icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }], apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }] },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const settings = await getSettings();
  const fontVar = locale === "ar" ? "'IBM Plex Sans Arabic', 'IBM Plex Sans'" : "'IBM Plex Sans', 'IBM Plex Sans Arabic'";

  return (
    <html lang={locale} dir={dirOf(locale)} style={{ ["--font-sans" as string]: fontVar }}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2">
          {locale === "ar" ? "تخطَّ إلى المحتوى" : "Skip to content"}
        </a>
        <TopBar dict={dict} settings={settings} locale={locale} />
        <Header locale={locale} dict={dict} bankName={t(settings.bankName, locale)} loginUrl={settings.internetBankingUrl} />
        <main id="main">{children}</main>
        <Footer locale={locale} dict={dict} settings={settings} />
        <PageViewBeacon />
        <Motion />
        <Parallax />
        <ServiceWorker />
      </body>
    </html>
  );
}

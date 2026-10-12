import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
// Self-hosted fonts (same as apps/web) — CSP font-src 'self', no third-party requests.
import "@fontsource/ibm-plex-sans-arabic/arabic-400.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-500.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-600.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-700.css";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-sans/latin-700.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-600.css";
import "../globals.css";
import { dirOf, isLocale, locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { ThemeProvider, themeBootScript } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Motion } from "@/components/providers/Motion";
import { ServiceWorker } from "@/components/providers/ServiceWorker";

export const generateStaticParams = () => locales.map((locale) => ({ locale }));

export const viewport: Viewport = {
  width: "device-width", initialScale: 1,
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#F4F6FB" }, { media: "(prefers-color-scheme: dark)", color: "#0C101A" }],
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDictionary(locale);
  return {
    title: { default: d.app.name, template: `%s · ${d.app.name}` },
    description: d.auth.subtitle,
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
    referrer: "strict-origin-when-cross-origin",
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: locale === "ar" ? "لوحة وِثاق" : "Withaq Admin" },
    icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }], apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }] },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const d = getDictionary(locale);
  const fontVar = locale === "ar" ? "'IBM Plex Sans Arabic', 'IBM Plex Sans'" : "'IBM Plex Sans', 'IBM Plex Sans Arabic'";

  return (
    <html lang={locale} dir={dirOf(locale)} style={{ ["--font-sans" as string]: fontVar }} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[90] focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:shadow-pop">
          {d.app.skip}
        </a>
        <I18nProvider locale={locale}>
          <ThemeProvider>
            <ToastProvider>
              <Motion />
              <ServiceWorker />
              <AuthProvider>{children}</AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

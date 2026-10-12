import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale } from "@/lib/i18n/config";

/**
 * 1. Redirects locale-less paths to /ar or /en (Accept-Language aware).
 * 2. Sets a strict, nonce-based Content-Security-Policy on every page.
 *    Cloudflare Turnstile's host is allowed only on pages that render a form, and only when a site key is configured.
 * 3. Forwards the pathname (x-pathname) so not-found.tsx can pick the right language.
 */
const TURNSTILE = "https://challenges.cloudflare.com";
const FORM_PAGES = /^\/(ar|en)\/(apply\/[a-z]+|contact|complaints|careers\/[^/]+)\/?$/;

/** Turnstile is enabled when the CMS publishes a site key; the deployment mirrors it in TURNSTILE_SITE_KEY. */
const turnstileEnabled = () => Boolean(process.env.TURNSTILE_SITE_KEY || process.env.TURNSTILE_ENABLED === "true");

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const first = pathname.split("/")[1] ?? "";

  if (!isLocale(first)) {
    const preferred = req.headers.get("accept-language")?.toLowerCase().startsWith("en") ? "en" : defaultLocale;
    const url = req.nextUrl.clone();
    url.pathname = `/${preferred}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const nonce = btoa(crypto.randomUUID());
  const dev = process.env.NODE_ENV !== "production";
  const ts = turnstileEnabled() && FORM_PAGES.test(pathname) ? ` ${TURNSTILE}` : "";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${ts}${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://media.example.ye",
    "font-src 'self'",
    "media-src 'self' https://media.example.ye",
    `connect-src 'self'${ts}`,
    `frame-src ${ts ? ts.trim() : "'none'"}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const headers = new Headers(req.headers);
  headers.set("x-nonce", nonce);
  headers.set("x-pathname", pathname);
  // Next.js reads the nonce from the request CSP header and applies it to its own scripts.
  headers.set("Content-Security-Policy", csp);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  // ملفّاتُ التثبيت تُستثنى: الوسيطُ يُحوّل كلَّ ما لا لغةَ له إلى /ar،
  // فكان طلبُ البيان وعاملِ الخدمة يُردُّ تحويلاً — ولا يُثبَّت تطبيقٌ
  // بيانُه ٣٠٧. والأيقوناتُ معهما.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|sw.js|icons/|brand/|demo/).*)"],
};

import { NextResponse, type NextRequest } from "next/server";

const LOCALES = ["ar", "en"];

/**
 * 1. Redirects locale-less paths to /ar (default) or /en (Accept-Language).
 * 2. Sets a strict nonce-based Content-Security-Policy + admin-specific headers on every page.
 *    (Static security headers are also set in next.config.ts; X-Robots-Tag keeps the console out of search engines.)
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const first = pathname.split("/")[1] ?? "";

  if (!LOCALES.includes(first)) {
    const preferred = req.headers.get("accept-language")?.toLowerCase().startsWith("en") ? "en" : "ar";
    const url = req.nextUrl.clone();
    url.pathname = `/${preferred}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const nonce = btoa(crypto.randomUUID());
  const dev = process.env.NODE_ENV !== "production";
  const media = process.env.MEDIA_ORIGIN ? ` ${process.env.MEDIA_ORIGIN}` : "";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${media}`,
    `media-src 'self' data: blob:${media}`,
    "font-src 'self'",
    "connect-src 'self'",
    `frame-src 'self' blob:${media}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(req.nextUrl.protocol === "https:" ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  const headers = new Headers(req.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = {
  // بيانُ التطبيق وعاملُ الخدمة والأيقونات: تُطلب كما هي، فلا يُحوَّل
  // طلبُها إلى صفحةِ لغةٍ — ولا يُثبَّت تطبيقٌ بيانُه ٣٠٧.
  matcher: ["/((?!backend|_next/static|_next/image|favicon.ico|robots.txt|manifest.webmanifest|sw.js|icons/|brand/).*)"],
};

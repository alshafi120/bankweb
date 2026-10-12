import type { NextConfig } from "next";

/**
 * Admin dashboard config.
 * - Real mode: `/backend/*` is rewritten to `${API_ORIGIN}/*` so the browser talks same-origin
 *   (Sanctum first-party cookies, SameSite=Strict). API_ORIGIN never reaches client code.
 * - Demo mode: when NEXT_PUBLIC_DEMO_MODE=true or API_ORIGIN is unset, the client uses an in-memory mock API.
 *   Only the resulting boolean is exposed to the browser.
 */
const apiOrigin = process.env.API_ORIGIN?.replace(/\/$/, "");
const demo = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !apiOrigin;

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  env: { NEXT_PUBLIC_DEMO_MODE: demo ? "true" : "false" },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    if (!apiOrigin) return [];
    return [{ source: "/backend/:path*", destination: `${apiOrigin}/:path*` }];
  },
};

export default config;

import type { MetadataRoute } from "next";

// Rendered on request so the runtime SITE_URL is used.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const site = process.env.SITE_URL ?? "http://localhost:3000";
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/*/apply/"] }], sitemap: `${site}/sitemap.xml` };
}

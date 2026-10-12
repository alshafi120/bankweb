import type { MetadataRoute } from "next";

/** The admin console must never be indexed (also enforced by X-Robots-Tag and meta robots). */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: "/" }] };
}

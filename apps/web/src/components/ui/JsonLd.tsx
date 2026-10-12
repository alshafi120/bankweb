import { headers } from "next/headers";
import { jsonLdString } from "@/lib/seo";

/** Structured data with the request's CSP nonce (set by src/proxy.ts). */
export async function JsonLd({ data }: { data: unknown }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />;
}

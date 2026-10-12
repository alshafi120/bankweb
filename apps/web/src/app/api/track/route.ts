import { NextResponse, type NextRequest } from "next/server";

/**
 * Privacy-friendly page-view beacon: { path, referrer? } → POST /api/v1/track (204).
 * No cookies, no identifiers; the API hashes the IP with a daily salt. Query strings are stripped.
 */
export const dynamic = "force-dynamic";

const PATH = /^\/(ar|en)(\/[\w\-./%]*)?$/;

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin) return new NextResponse(null, { status: 403 });
  if (Number(req.headers.get("content-length") ?? "0") > 2048) return new NextResponse(null, { status: 413 });

  let body: { path?: unknown; referrer?: unknown };
  try {
    body = JSON.parse(await req.text()) as typeof body;
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const path = typeof body.path === "string" ? body.path.split(/[?#]/)[0]!.slice(0, 300) : "";
  if (!PATH.test(path)) return new NextResponse(null, { status: 422 });

  // Only the referring host is kept (never full URLs that could carry personal data).
  let referrer: string | undefined;
  if (typeof body.referrer === "string" && body.referrer) {
    try { const host = new URL(body.referrer).hostname; if (host && host !== req.nextUrl.hostname) referrer = host; } catch { /* ignore */ }
  }

  const base = process.env.API_BASE_URL;
  if (base) {
    const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    try {
      await fetch(`${base}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "X-Forwarded-For": ip, "User-Agent": req.headers.get("user-agent")?.slice(0, 255) ?? "" },
        body: JSON.stringify({ path, ...(referrer ? { referrer } : {}) }),
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      });
    } catch { /* analytics must never fail the page */ }
  }
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

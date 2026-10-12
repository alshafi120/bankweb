import { NextResponse, type NextRequest } from "next/server";
import { FILE_FIELDS, demoReference, isFormKind, sniffFileType, validateForm, type FormKind } from "@/lib/forms/validation";

/**
 * Same-origin form endpoint (CSP connect-src 'self'): POST /api/forms/{account|financing|card|callback|complaint|job}
 *  1. rejects bodies > 6 MB, wrong content types and cross-site posts
 *  2. honeypot `website` filled → fake 201 (never tell a bot it was caught)
 *  3. re-validates with the same rules as the browser (lib/forms/validation.ts) + magic-byte file check
 *  4. forwards to the public API (JSON or multipart) with X-Forwarded-For, maps the response
 *  5. without API_BASE_URL (demo/local) → 201 { data: { reference }, demo: true }
 * Never logs request bodies or personal data.
 */
export const dynamic = "force-dynamic";

const MAX_BYTES = 6 * 1024 * 1024;
const UPSTREAM: Record<FormKind, (v: Record<string, unknown>) => string> = {
  account: () => "/applications", financing: () => "/applications", card: () => "/applications",
  callback: () => "/contact", complaint: () => "/complaints",
  job: (v) => `/jobs/${encodeURIComponent(String(v.jobSlug ?? ""))}/apply`,
};

const json = (status: number, body: unknown, headers?: HeadersInit) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
const invalid = (errors: Record<string, string>) =>
  json(422, { message: "The given data was invalid.", errors: Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, [v]])) });

function clientIp(req: NextRequest) {
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ form: string }> }) {
  const { form } = await params;
  if (!isFormKind(form)) return json(404, { message: "Not found." });

  // Browsers always send Origin on POST; reject cross-site submissions.
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin) return json(403, { message: "Forbidden." });

  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > MAX_BYTES) return json(413, { message: "Payload too large." });

  const type = req.headers.get("content-type") ?? "";
  const multipart = Boolean(FILE_FIELDS[form]);
  if (multipart ? !type.startsWith("multipart/form-data") : !type.startsWith("application/json")) {
    return json(415, { message: "Unsupported media type." });
  }

  // Read with a hard cap even if Content-Length is missing or lies.
  let raw: ArrayBuffer;
  try {
    raw = await readCapped(req, MAX_BYTES);
  } catch (e) {
    return (e as Error).message === "too-large" ? json(413, { message: "Payload too large." }) : json(400, { message: "Bad request." });
  }

  const values: Record<string, unknown> = {};
  const files: Record<string, File> = {};
  try {
    if (multipart) {
      const fd = await new Response(raw, { headers: { "content-type": type } }).formData();
      for (const [k, v] of fd.entries()) {
        if (typeof v === "string") values[k] = v;
        else if (FILE_FIELDS[form]?.includes(k) && v.size > 0) { files[k] = v; values[k] = { name: v.name, size: v.size, type: v.type }; }
      }
    } else {
      const parsed = JSON.parse(new TextDecoder().decode(raw)) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("shape");
      Object.assign(values, parsed);
    }
  } catch {
    return json(400, { message: "Bad request." });
  }

  // Honeypot → fake success, nothing stored or forwarded.
  if (typeof values.website === "string" && values.website.trim() !== "") {
    return json(201, { data: { reference: demoReference(form) } });
  }

  const result = validateForm(form, values);
  if (!result.ok) return invalid(result.errors);

  // Real file type from magic bytes (the API re-checks with finfo + AV scan).
  for (const [name, file] of Object.entries(files)) {
    const sniffed = sniffFileType(new Uint8Array(await file.slice(0, 8).arrayBuffer()));
    const allowed = name === "cv" ? ["application/pdf"] : ["application/pdf", "image/jpeg", "image/png"];
    if (!sniffed || !allowed.includes(sniffed)) return invalid({ [name]: name === "cv" ? "fileTypePdf" : "fileType" });
  }

  const locale = values.locale === "en" ? "en" : "ar";
  const turnstileToken = typeof values.turnstileToken === "string" ? values.turnstileToken.slice(0, 4096) : undefined;
  const payload: Record<string, unknown> = { ...result.data, locale, website: "", ...(turnstileToken ? { turnstileToken } : {}) };

  const base = process.env.API_BASE_URL;
  if (!base) return json(201, { data: { reference: demoReference(form) }, demo: true });

  let body: BodyInit;
  const headers: Record<string, string> = { Accept: "application/json", "X-Forwarded-For": clientIp(req), "User-Agent": req.headers.get("user-agent")?.slice(0, 255) ?? "" };
  if (multipart) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(payload)) fd.append(k, typeof v === "boolean" ? (v ? "1" : "0") : String(v));
    for (const [k, f] of Object.entries(files)) fd.append(k, f, f.name);
    body = fd;
  } else {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(payload);
  }

  try {
    const res = await fetch(`${base}${UPSTREAM[form](values)}`, { method: "POST", headers, body, cache: "no-store", signal: AbortSignal.timeout(15_000) });
    const data = (await res.json().catch(() => null)) as { data?: { reference?: string }; errors?: Record<string, string[]>; message?: string } | null;
    if (res.status === 201 && data?.data?.reference) return json(201, { data: { reference: data.data.reference } });
    if (res.status === 422 && data?.errors) {
      // Laravel messages are free text — map each field back to our error codes (fallback "required").
      const errors = Object.fromEntries(Object.keys(data.errors).map((k) => [k, ["required"]]));
      return json(422, { message: data.message ?? "The given data was invalid.", errors });
    }
    if (res.status === 429) return json(429, { message: "Too many requests." }, { "Retry-After": res.headers.get("retry-after") ?? "60" });
    return json(502, { message: "Upstream error." });
  } catch {
    return json(504, { message: "Upstream unavailable." });
  }
}

async function readCapped(req: NextRequest, max: number): Promise<ArrayBuffer> {
  if (!req.body) return new ArrayBuffer(0);
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) { await reader.cancel(); throw new Error("too-large"); }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) { out.set(c, offset); offset += c.byteLength; }
  return out.buffer;
}

export function GET() {
  return json(405, { message: "Method not allowed." }, { Allow: "POST" });
}

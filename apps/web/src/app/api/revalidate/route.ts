import { timingSafeEqual, createHash } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

/**
 * On-demand ISR, called by the API/CMS on publish:
 *   POST /api/revalidate   header: X-Revalidate-Secret: <REVALIDATE_SECRET>
 *   body: { "tags"?: string[], "paths"?: string[] }   paths are locale-less ("/news/my-slug") or "/" — both locales are revalidated.
 */
export const dynamic = "force-dynamic";

const TAG = /^[a-z0-9:_-]{1,128}$/i;
const PATH = /^\/[a-z0-9/_-]{0,200}$/i;

function secretOk(given: string | null) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || !given) return false;
  // Hash both so lengths match and timing doesn't leak the secret's length.
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!secretOk(req.headers.get("x-revalidate-secret"))) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
  let body: { tags?: unknown; paths?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Bad request." }, { status: 400 });
  }
  const tags = Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === "string" && TAG.test(t)).slice(0, 50) : [];
  const paths = Array.isArray(body.paths) ? body.paths.filter((p): p is string => typeof p === "string" && PATH.test(p)).slice(0, 50) : [];
  if (!tags.length && !paths.length) return NextResponse.json({ message: "Nothing to revalidate." }, { status: 422 });

  for (const tag of tags) revalidateTag(tag, "max");
  for (const p of paths) for (const l of ["ar", "en"]) revalidatePath(`/${l}${p === "/" ? "" : p}`);
  return NextResponse.json({ revalidated: { tags, paths }, now: Date.now() });
}

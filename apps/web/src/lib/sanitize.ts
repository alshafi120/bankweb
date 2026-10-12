/**
 * Tiny allow-list HTML sanitizer for CMS rich text — defence in depth (the API already sanitises).
 * Runs server-side only (used in Server Components). Pure: no DOM, no dependencies.
 *  - Known-dangerous elements are removed together with their content.
 *  - Allowed elements are re-emitted with only allowed attributes; everything else is dropped (text kept).
 *  - Links: http(s), mailto, tel, site-relative and fragment URLs only; external links get rel/target.
 *  - All text is re-escaped, so stray `<`, `>` and quotes can never form markup.
 */
const ALLOWED = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "small", "sub", "sup", "mark",
  "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "a", "hr", "code",
  "table", "thead", "tbody", "tr", "th", "td", "caption",
]);
const VOID = new Set(["br", "hr"]);
const DROP_WITH_CONTENT = ["script", "style", "iframe", "object", "embed", "template", "noscript", "svg", "math", "textarea", "select", "frameset", "frame", "head", "title"];
const ATTRS: Record<string, string[]> = { a: ["href", "title"], th: ["scope", "colspan", "rowspan"], td: ["colspan", "rowspan"], ol: ["start"] };

const escapeText = (s: string) =>
  s.replace(/&(?!(?:[a-z][a-z0-9]{1,31}|#\d{1,7}|#x[0-9a-f]{1,6});)/gi, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function decodeEntities(s: string) {
  return s
    .replace(/&#x([0-9a-f]+);?/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16) % 0x110000))
    .replace(/&#(\d+);?/g, (_, d: string) => String.fromCodePoint(Number(d) % 0x110000))
    .replace(/&colon;/gi, ":").replace(/&tab;/gi, "\t").replace(/&newline;/gi, "\n").replace(/&amp;/gi, "&");
}

/** Returns a safe href or null. */
export function safeUrl(raw: string): string | null {
  // Strip control chars/whitespace browsers ignore inside schemes ("java\tscript:")
  // eslint-disable-next-line no-control-regex
  const v = decodeEntities(raw).replace(/[\u0000- \u007f-\u009f]/g, "");
  if (!v) return null;
  if (v.startsWith("/") && !v.startsWith("//")) return raw.trim();
  if (v.startsWith("#")) return raw.trim();
  if (/^(https?:|mailto:|tel:)/i.test(v)) return raw.trim();
  return null;
}

function parseAttrs(src: string): [string, string][] {
  const out: [string, string][] = [];
  const re = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) out.push([m[1]!.toLowerCase(), m[2] ?? m[3] ?? m[4] ?? ""]);
  return out;
}

export function sanitizeHtml(input: string): string {
  if (!input) return "";
  let html = input.replace(/<!--[\s\S]*?(?:-->|$)/g, "").replace(/<!\[CDATA\[[\s\S]*?(?:\]\]>|$)/g, "").replace(/<![^>]*>/g, "");
  for (const tag of DROP_WITH_CONTENT) {
    html = html.replace(new RegExp(`<${tag}\\b[\\s\\S]*?(?:<\\/${tag}\\s*>|$)`, "gi"), "");
  }

  const out: string[] = [];
  const stack: string[] = [];
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = tagRe.exec(html))) {
    out.push(escapeText(html.slice(last, m.index)));
    last = tagRe.lastIndex;
    const name = m[1]!.toLowerCase();
    const closing = m[0].startsWith("</");
    if (!ALLOWED.has(name)) continue;

    if (closing) {
      const idx = stack.lastIndexOf(name);
      if (idx === -1) continue;
      while (stack.length > idx) out.push(`</${stack.pop()}>`);
      continue;
    }

    const attrs: string[] = [];
    let external = false;
    for (const [k, v] of parseAttrs(m[2] ?? "")) {
      if (!ATTRS[name]?.includes(k)) continue;
      if (k === "href") {
        const url = safeUrl(v);
        if (!url) continue;
        external = /^https?:/i.test(url);
        attrs.push(`href="${escapeAttr(url)}"`);
      } else if (k === "colspan" || k === "rowspan" || k === "start") {
        if (/^\d{1,3}$/.test(v)) attrs.push(`${k}="${v}"`);
      } else if (k === "scope") {
        if (/^(row|col|rowgroup|colgroup)$/.test(v)) attrs.push(`scope="${v}"`);
      } else {
        attrs.push(`${k}="${escapeAttr(v)}"`);
      }
    }
    if (name === "a" && external) attrs.push('target="_blank"', 'rel="noopener noreferrer nofollow"');
    out.push(`<${name}${attrs.length ? " " + attrs.join(" ") : ""}>`);
    if (!VOID.has(name)) stack.push(name);
  }
  out.push(escapeText(html.slice(last)));
  while (stack.length) out.push(`</${stack.pop()}>`);
  return out.join("");
}

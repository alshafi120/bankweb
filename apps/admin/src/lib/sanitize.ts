/**
 * Tiny allow-list sanitizers (client-side, DOMParser based) used ONLY for:
 *  1. rich-text preview / editor content (`sanitizeHtml`)
 *  2. the 2FA QR code SVG returned by the API (`sanitizeSvg`)
 * The server sanitizes again on save (defence in depth). Everything else in the UI is rendered as text by React.
 */

const HTML_TAGS = new Set(["p", "br", "strong", "b", "em", "i", "u", "h2", "h3", "h4", "ul", "ol", "li", "a", "blockquote"]);
const DROP_WITH_CONTENT = new Set(["script", "style", "iframe", "object", "embed", "template", "noscript", "svg", "math", "form", "input", "textarea", "select", "button", "link", "meta", "title", "head"]);

export function isSafeHref(href: string): boolean {
  const v = href.trim();
  if (v === "") return false;
  if (/^(https?:|mailto:|tel:)/i.test(v)) return true;
  return /^\/(?!\/)/.test(v) || /^#[\w-]*$/.test(v); // same-site relative paths and anchors only
}

const escapeText = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

export function sanitizeHtml(input: string | null | undefined): string {
  const html = input ?? "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return escapeText(html.replace(/<[^>]*>/g, ""));
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const out = document.implementation.createHTMLDocument("");
  const walk = (node: Node, target: Node) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) { target.appendChild(out.createTextNode(child.textContent ?? "")); return; }
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      const el = child as Element;
      const tag = el.tagName.toLowerCase();
      if (DROP_WITH_CONTENT.has(tag)) return;
      if (!HTML_TAGS.has(tag)) { walk(el, target); return; }  // unwrap unknown tags, keep their text
      const norm = tag === "b" ? "strong" : tag === "i" ? "em" : tag;
      const clean = out.createElement(norm);
      if (norm === "a") {
        const href = el.getAttribute("href") ?? "";
        if (!isSafeHref(href)) { walk(el, target); return; }
        clean.setAttribute("href", href.trim());
        if (/^https?:/i.test(href.trim())) { clean.setAttribute("rel", "noopener noreferrer nofollow"); clean.setAttribute("target", "_blank"); }
      }
      target.appendChild(clean);
      walk(el, clean);
    });
  };
  walk(doc.body, out.body);
  return out.body.innerHTML.replace(/<p><\/p>/g, "").trim();
}

/** Plain text from HTML (search, excerpts, character counts). */
export function htmlToText(html: string | null | undefined): string {
  const v = html ?? "";
  if (typeof DOMParser === "undefined") return v.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return (new DOMParser().parseFromString(v, "text/html").body.textContent ?? "").replace(/\s+/g, " ").trim();
}

const SVG_TAGS = new Set(["svg", "path", "rect"]);
const SVG_ATTRS: Record<string, RegExp> = {
  viewBox: /^[\d.\s-]+$/, width: /^[\d.]+(px|%)?$/, height: /^[\d.]+(px|%)?$/, x: /^-?[\d.]+$/, y: /^-?[\d.]+$/,
  d: /^[MmLlHhVvCcSsQqTtAaZz\d.,\s-]+$/, fill: /^(none|currentColor|#[0-9a-fA-F]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\))$/,
  stroke: /^(none|currentColor|#[0-9a-fA-F]{3,8})$/, "stroke-width": /^[\d.]+$/, "shape-rendering": /^(crispEdges|auto|geometricPrecision)$/,
  "fill-rule": /^(evenodd|nonzero)$/, xmlns: /^http:\/\/www\.w3\.org\/2000\/svg$/, rx: /^[\d.]+$/,
};

/** Only <svg>, <path>, <rect> with geometric/paint attributes survive. Returns "" if the root is not an <svg>. */
export function sanitizeSvg(input: string): string {
  if (typeof DOMParser === "undefined") return "";
  const doc = new DOMParser().parseFromString(input, "image/svg+xml");
  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== "svg" || doc.getElementsByTagName("parsererror").length) return "";
  const NS = "http://www.w3.org/2000/svg";
  const out = document.implementation.createDocument(NS, "svg", null);
  const copy = (src: Element, dst: Element) => {
    for (const attr of Array.from(src.attributes)) {
      const rule = SVG_ATTRS[attr.name];
      if (rule && rule.test(attr.value)) dst.setAttribute(attr.name, attr.value);
    }
    for (const child of Array.from(src.children)) {
      const tag = child.nodeName.toLowerCase();
      if (!SVG_TAGS.has(tag) || tag === "svg") continue;
      const el = out.createElementNS(NS, tag);
      copy(child, el);
      dst.appendChild(el);
    }
  };
  const svg = out.documentElement;
  copy(root, svg);
  svg.setAttribute("role", "img");
  return new XMLSerializer().serializeToString(svg);
}

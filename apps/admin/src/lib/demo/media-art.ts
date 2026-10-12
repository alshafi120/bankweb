/** Generated SVG artwork (data URIs) for demo media — no binary assets, CSP-safe (img-src data:). */

const enc = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const TONES: [string, string, string][] = [
  ["#0C3A36", "#165E57", "#C8892A"], ["#123B5C", "#2D5C8A", "#E0A54A"], ["#3B2A12", "#8A5A1E", "#E3EFEC"],
  ["#14332F", "#3FA597", "#F6F7F4"], ["#2A1E36", "#5B4A8A", "#E0A54A"], ["#0F2B2A", "#1F7A70", "#7FA9D6"],
];

/** Qamariya-inspired cover: arch + lattice + sun. `seed` picks tone and composition. */
export function coverArt(seed: number, w = 1200, h = 800, label?: string): string {
  const [bg, mid, acc] = TONES[seed % TONES.length]!;
  const cx = w * (0.3 + ((seed * 37) % 40) / 100);
  const r = Math.min(w, h) * 0.32;
  const lattice = Array.from({ length: 6 }, (_, i) => `<path d="M${cx - r + (i * r) / 3} ${h} V${h * 0.55}" stroke="${acc}" stroke-opacity=".18" stroke-width="2"/>`).join("");
  const text = label ? `<text x="${w / 2}" y="${h - 48}" font-family="IBM Plex Sans, sans-serif" font-size="42" font-weight="600" fill="#fff" fill-opacity=".85" text-anchor="middle">${label.replace(/[<&>]/g, "")}</text>` : "";
  return enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="${mid}"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>
<circle cx="${w * 0.8}" cy="${h * 0.25}" r="${r * 0.35}" fill="${acc}" fill-opacity=".85"/>
<path d="M${cx - r} ${h} V${h * 0.55} A${r} ${r} 0 0 1 ${cx + r} ${h * 0.55} V${h} Z" fill="#fff" fill-opacity=".08"/>
<path d="M${cx - r * 0.7} ${h * 0.55} A${r * 0.7} ${r * 0.7} 0 0 1 ${cx} ${h * 0.55 - r * 0.7} V${h * 0.55} Z" fill="${acc}" fill-opacity=".55"/>
<path d="M${cx} ${h * 0.55 - r * 0.7} A${r * 0.7} ${r * 0.7} 0 0 1 ${cx + r * 0.7} ${h * 0.55} H${cx} Z" fill="#7FA9D6" fill-opacity=".55"/>
${lattice}${text}</svg>`);
}

export function portraitArt(seed: number, initials: string): string {
  const [bg, mid, acc] = TONES[seed % TONES.length]!;
  return enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
<rect width="400" height="400" fill="${bg}"/><circle cx="200" cy="160" r="72" fill="${mid}"/><path d="M70 400c10-90 70-140 130-140s120 50 130 140z" fill="${mid}"/>
<text x="200" y="182" font-family="IBM Plex Sans, sans-serif" font-size="64" font-weight="700" fill="${acc}" text-anchor="middle">${initials.replace(/[<&>]/g, "")}</text></svg>`);
}

/** File-type tile used as thumbnail for PDFs, DOCX and videos. */
export function fileTile(kind: "pdf" | "document" | "video", name: string): string {
  const color = kind === "pdf" ? "#B42318" : kind === "video" ? "#2D5C8A" : "#165E57";
  const tag = kind === "pdf" ? "PDF" : kind === "video" ? "MP4" : "DOCX";
  const glyph = kind === "video"
    ? `<circle cx="300" cy="170" r="64" fill="${color}" fill-opacity=".12"/><path d="M280 135 L340 170 L280 205 Z" fill="${color}"/>`
    : `<path d="M240 80h90l50 50v130H240z" fill="#fff" stroke="${color}" stroke-width="6"/><path d="M330 80v50h50" fill="none" stroke="${color}" stroke-width="6"/><path d="M265 170h90M265 195h90M265 220h60" stroke="${color}" stroke-opacity=".5" stroke-width="8" stroke-linecap="round"/>`;
  return enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
<rect width="600" height="400" fill="#F1F4F2"/>${glyph}
<rect x="210" y="282" width="180" height="44" rx="22" fill="${color}"/><text x="300" y="312" font-family="IBM Plex Mono, monospace" font-size="22" font-weight="600" fill="#fff" text-anchor="middle">${tag}</text>
<text x="300" y="365" font-family="IBM Plex Sans, sans-serif" font-size="20" fill="#5A6B68" text-anchor="middle">${name.slice(0, 40).replace(/[<&>]/g, "")}</text></svg>`);
}

/** A tiny valid one-page PDF (used for demo previews through a blob: URL). */
export function tinyPdf(title: string): string {
  const safe = title.replace(/[()\\]/g, "").replace(/[^\x20-\x7E]/g, "").slice(0, 60) || "Withaq Bank document";
  const stream = `BT /F1 22 Tf 72 720 Td (${safe}) Tj ET BT /F1 12 Tf 72 690 Td (Withaq Bank - fictional demo document) Tj ET`;
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => { offsets.push(body.length); body += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = body.length;
  body += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  body += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return `data:application/pdf;base64,${btoa(body)}`;
}

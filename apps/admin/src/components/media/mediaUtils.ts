import type { MediaItem, MediaRef } from "@/types/api";

export const MAX_BYTES = 5 * 1024 * 1024;
export const ACCEPT: Record<MediaItem["kind"], RegExp> = {
  image: /^image\/(jpeg|png|webp|gif|svg\+xml|avif)$/,
  video: /^video\/mp4$/,
  pdf: /^application\/pdf$/,
  document: /^application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document$/,
};
export const ACCEPT_ATTR = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif,video/mp4,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function kindOfFile(file: File): MediaItem["kind"] | null {
  // Some browsers report "" for .docx; fall back to the extension (the server re-checks the real MIME).
  const type = file.type || (file.name.toLowerCase().endsWith(".docx") ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "");
  for (const [k, re] of Object.entries(ACCEPT)) if (re.test(type)) return k as MediaItem["kind"];
  return null;
}

export const toRef = (m: MediaItem): MediaRef => ({ id: m.id, url: m.url, alt: m.alt, mime: m.mime, width: m.width, height: m.height });

/** Only data:/blob:/http(s)/same-origin URLs are ever put into src attributes. */
export const safeSrc = (url: string | null | undefined) => (url && /^(data:image\/|data:application\/pdf|data:video\/|blob:|https?:\/\/|\/(?!\/))/.test(url) ? url : "");

/** data:…;base64 → blob: URL (decoded locally; no fetch, so CSP connect-src stays 'self'). */
export function dataUrlToBlobUrl(dataUrl: string): string {
  const m = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUrl);
  if (!m) return "";
  const bytes = m[2] ? Uint8Array.from(atob(m[3]!), (c) => c.charCodeAt(0)) : new TextEncoder().encode(decodeURIComponent(m[3]!));
  return URL.createObjectURL(new Blob([bytes], { type: m[1] }));
}

"use client";

import clsx from "clsx";
import type { MediaItem, MediaRef } from "@/types/api";
import { Icon } from "@/components/ui/Icon";
import { safeSrc } from "./mediaUtils";
import { useI18n } from "@/components/providers/I18nProvider";
import { tl } from "@/lib/i18n/config";

/** Thumbnail for images (and generated tiles); icon fallback for other kinds. */
export function MediaThumb({ media, className, rounded = "rounded-md" }: { media: Pick<MediaItem, "url" | "mime" | "alt"> | MediaRef | null | undefined; className?: string; rounded?: string }) {
  const { locale } = useI18n();
  if (!media) return <span className={clsx("grid place-items-center bg-line/40 text-muted", rounded, className)}><Icon name="image" className="size-4" /></span>;
  const src = safeSrc(media.url);
  const isImg = media.mime.startsWith("image/") || src.startsWith("data:image/svg");
  if (src && (isImg || src.startsWith("data:image/"))) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={tl(media.alt, locale)} loading="lazy" decoding="async" className={clsx("bg-line/30 object-cover", rounded, className)} />;
  }
  const icon = media.mime.startsWith("video/") ? "video" : media.mime === "application/pdf" ? "pdf" : "file";
  return <span className={clsx("grid place-items-center bg-brand-100 text-brand-700", rounded, className)}><Icon name={icon} className="size-5" /></span>;
}

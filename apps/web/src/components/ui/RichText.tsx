import clsx from "clsx";
import { sanitizeHtml } from "@/lib/sanitize";

/** CMS rich text → sanitised HTML (server-side allow-list) with typographic defaults. */
export function RichText({ html, className }: { html: string; className?: string }) {
  return <div className={clsx("rich-text", className)} dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />;
}

import type { HomeContent, Locale } from "@/types/content";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** Every section is a Page Builder block: same props, rendered from page_sections in order. */
export interface SectionProps {
  content: HomeContent;
  locale: Locale;
  dict: Dictionary;
}

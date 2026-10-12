import { notFound } from "next/navigation";
import type { Locale } from "@/types/content";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export type LocaleParams = Promise<{ locale: string }>;
export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Resolve `[locale]` (404 on anything else) and its dictionary. */
export async function resolve(params: Promise<{ locale: string }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return { locale: locale as Locale, dict: getDictionary(locale) };
}

/** For generateMetadata: never throws, falls back to Arabic. */
export async function metaLocale(params: Promise<{ locale: string }>) {
  const { locale } = await params;
  const l: Locale = isLocale(locale) ? locale : "ar";
  return { locale: l, dict: getDictionary(l) };
}

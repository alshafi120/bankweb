"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "@/types/api";
import { fmt, getDictionary, type Dict } from "@/lib/i18n/dictionaries";
import { dirOf } from "@/lib/i18n/config";

interface I18n { locale: Locale; dir: "rtl" | "ltr"; d: Dict; f: typeof fmt }
const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo<I18n>(() => ({ locale, dir: dirOf(locale), d: getDictionary(locale), f: fmt }), [locale]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n outside I18nProvider");
  return v;
}

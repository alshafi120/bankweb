import { headers } from "next/headers";
import type { Locale } from "@/types/content";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getCards, getFinancingProducts, getLocations, getSettings } from "@/lib/api/client";
import { formFields } from "@/lib/forms/fields";
import type { FormKind } from "@/lib/forms/validation";
import { PublicForm } from "./PublicForm";

/** Server wrapper: loads options (branches, products), builds field specs and renders the client form. */
export async function FormSection({ kind, locale, dict, initial, hidden, labelledBy }: {
  kind: FormKind; locale: Locale; dict: Dictionary;
  initial?: Record<string, string | boolean>; hidden?: Record<string, string>; labelledBy?: string;
}) {
  const [branches, financing, cards, settings, h] = await Promise.all([
    getLocations("branch"),
    kind === "financing" ? getFinancingProducts() : Promise.resolve([]),
    kind === "card" ? getCards() : Promise.resolve([]),
    getSettings(),
    headers(),
  ]);
  const fields = formFields(kind, { locale, dict, branches, financing, cards });
  return (
    <PublicForm kind={kind} fields={fields} initial={initial} hidden={hidden} labelledBy={labelledBy} locale={locale}
      strings={{ forms: dict.forms, common: dict.common }}
      turnstileSiteKey={settings.turnstileSiteKey ?? null} nonce={h.get("x-nonce") ?? undefined} />
  );
}

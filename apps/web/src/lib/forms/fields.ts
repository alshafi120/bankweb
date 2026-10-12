import "server-only";
import type { AccountProduct, CardProduct, FinancingProduct, Location, Locale } from "@/types/content";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { FieldSpec } from "@/components/forms/types";
import { t } from "@/lib/i18n/config";
import { ACCOUNT_TYPES, COMPLAINT_CATEGORIES, CONTACT_SUBJECTS, PREFERRED_TIMES, type FormKind } from "./validation";

/** Field layouts for the six public forms. Labels come from the dictionary on the client; options are localised here. */

const opts = <T extends string>(values: readonly T[], labels: Record<T, string>) => values.map((v) => ({ value: v, label: labels[v] }));

/** Unique cities (value = English name, label = localised) from the branch network. */
export const cityOptions = (locations: Location[], locale: Locale) =>
  [...new Map(locations.map((l) => [l.city.en, { value: l.city.en, label: t(l.city, locale) }])).values()];

const fullName: FieldSpec = { name: "fullName", kind: "text", autoComplete: "name", maxLength: 120 };
const nationalId: FieldSpec = { name: "nationalId", kind: "text", inputMode: "numeric", ltr: true, autoComplete: "off", maxLength: 14 };
const phone: FieldSpec = { name: "phone", kind: "tel", inputMode: "tel", ltr: true, autoComplete: "tel", maxLength: 20 };
const email: FieldSpec = { name: "email", kind: "email", inputMode: "email", ltr: true, autoComplete: "email", maxLength: 160 };
const city = (options: FieldSpec["options"]): FieldSpec => ({ name: "city", kind: "select", options, autoComplete: "address-level2" });

export interface FieldContext {
  locale: Locale;
  dict: Dictionary;
  branches: Location[];
  financing?: FinancingProduct[];
  cards?: CardProduct[];
  accounts?: AccountProduct[];
}

export function formFields(kind: FormKind, { locale, dict, branches, financing = [], cards = [] }: FieldContext): FieldSpec[] {
  const o = dict.forms.options;
  const cities = cityOptions(branches, locale);
  const branchOptions = branches.map((b) => ({ value: b.id, label: `${t(b.name, locale)} — ${t(b.city, locale)}` }));

  switch (kind) {
    case "account":
      return [fullName, nationalId, phone, email, city(cities),
        { name: "accountType", kind: "select", options: opts(ACCOUNT_TYPES, o.accountType) },
        { name: "branchId", kind: "select", options: branchOptions }];
    case "financing":
      return [
        { name: "financingProductId", kind: "select", options: financing.map((p) => ({ value: p.id, label: t(p.name, locale) })), full: true },
        { name: "amount", kind: "number", inputMode: "numeric", ltr: true },
        { name: "months", kind: "number", inputMode: "numeric", ltr: true },
        fullName, nationalId, phone, email, city(cities),
        { name: "monthlyIncome", kind: "number", inputMode: "numeric", ltr: true },
        { name: "employer", kind: "text", autoComplete: "organization", maxLength: 120 },
        { name: "notes", kind: "textarea", full: true, maxLength: 2000, rows: 3 },
      ];
    case "card":
      return [
        { name: "cardId", kind: "select", options: cards.map((c) => ({ value: c.id, label: `${t(c.name, locale)} (${c.network})` })), full: true },
        fullName, nationalId, phone, email, city(cities),
        { name: "hasAccount", kind: "checkbox", full: true },
        { name: "accountLast4", kind: "text", inputMode: "numeric", ltr: true, maxLength: 4, autoComplete: "off", showIf: { field: "hasAccount", equals: true } },
      ];
    case "callback":
      return [fullName, phone, email,
        { name: "subject", kind: "select", options: opts(CONTACT_SUBJECTS, o.subject) },
        { name: "preferredTime", kind: "select", options: opts(PREFERRED_TIMES, o.preferredTime) },
        { name: "message", kind: "textarea", full: true, maxLength: 2000, rows: 4 }];
    case "complaint":
      return [fullName, phone, email, { ...nationalId },
        { name: "category", kind: "select", options: opts(COMPLAINT_CATEGORIES, o.category) },
        { name: "branchId", kind: "select", options: branchOptions },
        { name: "transactionDate", kind: "date", ltr: true, max: new Date().toISOString().slice(0, 10) },
        { name: "description", kind: "textarea", full: true, maxLength: 2000, rows: 5 },
        { name: "attachment", kind: "file", accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png", full: true }];
    case "job":
      return [fullName, phone, { ...email }, city(cities),
        { name: "education", kind: "text", maxLength: 160 },
        { name: "experienceYears", kind: "number", inputMode: "numeric", ltr: true },
        { name: "coverLetter", kind: "textarea", full: true, maxLength: 2000, rows: 4 },
        { name: "cv", kind: "file", accept: ".pdf,application/pdf", full: true }];
  }
}

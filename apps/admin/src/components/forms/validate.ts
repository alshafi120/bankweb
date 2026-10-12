import type { Localized } from "@/types/api";
import type { FieldDef } from "@/resources/types";
import type { Dict } from "@/lib/i18n/dictionaries";
import { fmt } from "@/lib/i18n/dictionaries";
import { htmlToText } from "@/lib/sanitize";

/** Error keys: "title.ar", "slug", "lat" … (dot-paths match the 422 `errors` keys the API returns). */
export type Errors = Record<string, string>;

const isEmpty = (v: unknown) => v === null || v === undefined || (typeof v === "string" && v.trim() === "");

export function validateRecord(fields: FieldDef[], values: Record<string, unknown>, d: Dict, isNew: boolean): Errors {
  const e: Errors = {};
  for (const fd of fields) {
    if (fd.createOnly && !isNew) continue;
    const v = values[fd.name];
    const required = fd.required || (fd.requiredOnCreate && isNew);
    switch (fd.type) {
      case "localizedText": case "localizedTextarea": case "localizedRichText": {
        const l = (v ?? {}) as Localized;
        if (required) for (const lang of ["ar", "en"] as const) {
          const text = fd.type === "localizedRichText" ? htmlToText(l[lang]) : l[lang];
          if (isEmpty(text)) e[`${fd.name}.${lang}`] = d.form.required;
        }
        break;
      }
      case "slug":
        if (required && isEmpty(v)) e[fd.name] = d.form.required;
        else if (!isEmpty(v) && !/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(String(v))) e[fd.name] = d.form.invalidSlug;
        break;
      case "email":
        if (required && isEmpty(v)) e[fd.name] = d.form.required;
        else if (!isEmpty(v) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v))) e[fd.name] = d.form.invalidEmail;
        break;
      case "url":
        if (required && isEmpty(v)) e[fd.name] = d.form.required;
        else if (!isEmpty(v) && !/^https:\/\/[^\s]+$/.test(String(v))) e[fd.name] = d.form.invalidUrl;
        break;
      case "password":
        if (required && isEmpty(v)) e[fd.name] = d.form.required;
        else if (!isEmpty(v)) {
          const p = String(v);
          if (!(p.length >= 12 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p))) e[fd.name] = d.policy.title;
        }
        break;
      case "number": case "money": case "percent": {
        if (isEmpty(v)) { if (required) e[fd.name] = d.form.required; break; }
        const n = Number(v);
        if (!Number.isFinite(n)) e[fd.name] = d.form.invalidNumber;
        else if (fd.min !== undefined && n < fd.min) e[fd.name] = fmt(d.form.min, { min: fd.min });
        else if (fd.max !== undefined && n > fd.max) e[fd.name] = fmt(d.form.max, { max: fd.max });
        break;
      }
      case "latlng": {
        const lat = values.lat as number | null; const lng = values.lng as number | null;
        if (lat == null || !Number.isFinite(lat) || Math.abs(lat) > 90) e.lat = d.form.invalidNumber;
        if (lng == null || !Number.isFinite(lng) || Math.abs(lng) > 180) e.lng = d.form.invalidNumber;
        break;
      }
      case "multiselect":
        if (required && (!Array.isArray(v) || v.length === 0)) e[fd.name] = d.form.required;
        break;
      case "media": case "select": case "status": case "relation": case "icon": case "date": case "datetime": case "text":
        if (required && isEmpty(v)) e[fd.name] = d.form.required;
        break;
    }
  }
  // Cross-field: date ranges
  if (values.startsAt && values.endsAt && String(values.endsAt) < String(values.startsAt)) e.endsAt = fmt(d.form.min, { min: String(values.startsAt).slice(0, 10) });
  return e;
}

/** 422 { errors: { "title.ar": ["..."] } } → flat map (keys already camelCase per the contract). */
export const fromServer = (errors: Record<string, string[]>): Errors =>
  Object.fromEntries(Object.entries(errors).map(([k, v]) => [k.replace(/\[(\w+)\]/g, ".$1"), v[0] ?? ""]));

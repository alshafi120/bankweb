/**
 * Shared validation for the six public forms.
 * Pure module (no Next/React imports, relative .ts imports) — runs in the browser (inline errors),
 * in the /api/forms route handler (server re-validation) and under `node --test`.
 * Rules mirror VALIDATION from the API contract so the Laravel FormRequests and the site agree.
 */
import { VALIDATION } from "../../types/api.ts";

export const FORM_KINDS = ["account", "financing", "card", "callback", "complaint", "job"] as const;
export type FormKind = (typeof FORM_KINDS)[number];
export const isFormKind = (v: string): v is FormKind => (FORM_KINDS as readonly string[]).includes(v);

/** Error codes (translated on the client via the dictionary; also used as 422 messages by the route handler). */
export type ErrorCode =
  | "required" | "minLength" | "maxLength" | "phone" | "nationalId" | "email" | "number" | "min" | "max"
  | "choice" | "consent" | "accountLast4" | "date" | "futureDate" | "fileType" | "fileTypePdf" | "fileSize" | "slug";
export type FieldErrors = Record<string, ErrorCode>;

type Rule =
  | { kind: "text"; min?: number; max: number }
  | { kind: "fullName" }
  | { kind: "phone" }
  | { kind: "nationalId" }
  | { kind: "email" }
  | { kind: "int"; min: number; max: number }
  | { kind: "choice"; options: readonly string[] }
  | { kind: "slug" }
  | { kind: "bool" }
  | { kind: "consent" }
  | { kind: "last4" }
  | { kind: "pastDate" }
  | { kind: "file"; accept: "pdf" | "doc-image" };

interface FieldRule { rule: Rule; required: boolean; requiredIf?: (v: Values) => boolean; send?: boolean }
type Values = Record<string, unknown>;
type Schema = Record<string, FieldRule>;

export const ACCOUNT_TYPES = ["current", "savings", "investment", "business"] as const;
export const CONTACT_SUBJECTS = ["general", "accounts", "financing", "cards", "digital", "other"] as const;
export const PREFERRED_TIMES = ["morning", "afternoon", "evening"] as const;
export const COMPLAINT_CATEGORIES = ["service", "transaction", "staff", "digital", "fees", "other"] as const;
export const FINANCING_LIMITS = { minAmount: 100_000, maxAmount: 500_000_000, minMonths: 6, maxMonths: 84 } as const;

const req = (rule: Rule): FieldRule => ({ rule, required: true });
const opt = (rule: Rule): FieldRule => ({ rule, required: false });

const person = { fullName: req({ kind: "fullName" }), phone: req({ kind: "phone" }), email: opt({ kind: "email" }) };
const applicant = { ...person, nationalId: req({ kind: "nationalId" }), city: req({ kind: "text", min: 2, max: 60 }), consent: req({ kind: "consent" }) };

export const SCHEMAS: Record<FormKind, Schema> = {
  account: { ...applicant, accountType: req({ kind: "choice", options: ACCOUNT_TYPES }), branchId: opt({ kind: "slug" }) },
  financing: {
    ...applicant,
    financingProductId: req({ kind: "slug" }),
    amount: req({ kind: "int", min: FINANCING_LIMITS.minAmount, max: FINANCING_LIMITS.maxAmount }),
    months: req({ kind: "int", min: FINANCING_LIMITS.minMonths, max: FINANCING_LIMITS.maxMonths }),
    monthlyIncome: req({ kind: "int", min: 1, max: 10_000_000_000 }),
    employer: opt({ kind: "text", max: 120 }),
    notes: opt({ kind: "text", max: VALIDATION.messageMax }),
  },
  card: {
    ...applicant,
    cardId: req({ kind: "slug" }),
    hasAccount: opt({ kind: "bool" }),
    accountLast4: { rule: { kind: "last4" }, required: false, requiredIf: (v) => v.hasAccount === true || v.hasAccount === "true" },
  },
  callback: {
    ...person,
    subject: req({ kind: "choice", options: CONTACT_SUBJECTS }),
    message: req({ kind: "text", min: VALIDATION.messageMin, max: VALIDATION.messageMax }),
    preferredTime: opt({ kind: "choice", options: PREFERRED_TIMES }),
    // ContactInput has no consent field: collected and checked here, not forwarded.
    consent: { rule: { kind: "consent" }, required: true, send: false },
  },
  complaint: {
    ...person,
    nationalId: opt({ kind: "nationalId" }),
    category: req({ kind: "choice", options: COMPLAINT_CATEGORIES }),
    branchId: opt({ kind: "slug" }),
    transactionDate: opt({ kind: "pastDate" }),
    description: req({ kind: "text", min: VALIDATION.messageMin, max: VALIDATION.messageMax }),
    consent: req({ kind: "consent" }),
    attachment: opt({ kind: "file", accept: "doc-image" }),
  },
  job: {
    ...person,
    email: req({ kind: "email" }),
    city: req({ kind: "text", min: 2, max: 60 }),
    education: req({ kind: "text", min: 2, max: 160 }),
    experienceYears: req({ kind: "int", min: 0, max: 50 }),
    coverLetter: opt({ kind: "text", max: VALIDATION.messageMax }),
    consent: req({ kind: "consent" }),
    cv: req({ kind: "file", accept: "pdf" }),
    jobSlug: { rule: { kind: "slug" }, required: true, send: false },
  },
};

/** Fields that carry files (multipart forms). */
export const FILE_FIELDS: Partial<Record<FormKind, string[]>> = { complaint: ["attachment"], job: ["cv"] };

/** Minimal file shape shared by browser File and server-side checks. */
export interface FileLike { name: string; size: number; type: string }

export const stripSpaces = (s: string) => s.replace(/[\s\-()]/g, "");
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
const SLUG = /^[a-z0-9][a-z0-9_-]{0,79}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const isEmpty = (v: unknown) => v === undefined || v === null || (typeof v === "string" && v.trim() === "") || v === false;
const asString = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
const asInt = (v: unknown): number | null => {
  const s = asString(v).replace(/[,\s]/g, "");
  return /^-?\d+$/.test(s) ? Number(s) : null;
};
const asBool = (v: unknown) => v === true || v === "true" || v === "on" || v === "1";

export const PDF_TYPES = ["application/pdf"];
export const DOC_IMAGE_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const EXT: Record<"pdf" | "doc-image", RegExp> = { pdf: /\.pdf$/i, "doc-image": /\.(pdf|jpe?g|png)$/i };

/** Client + server: declared type, extension and size. */
export function checkFile(file: FileLike, accept: "pdf" | "doc-image"): ErrorCode | null {
  const types = accept === "pdf" ? PDF_TYPES : DOC_IMAGE_TYPES;
  if (!EXT[accept].test(file.name) || (file.type && !types.includes(file.type))) return accept === "pdf" ? "fileTypePdf" : "fileType";
  if (file.size <= 0 || file.size > VALIDATION.uploadMaxBytes) return "fileSize";
  return null;
}

/** Server: real type from magic bytes (the API re-checks with finfo). */
export function sniffFileType(bytes: Uint8Array): "application/pdf" | "image/png" | "image/jpeg" | null {
  const b = (i: number) => bytes[i] ?? -1;
  if (b(0) === 0x25 && b(1) === 0x50 && b(2) === 0x44 && b(3) === 0x46) return "application/pdf"; // %PDF
  if (b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47) return "image/png";
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return "image/jpeg";
  return null;
}

function checkRule(rule: Rule, raw: unknown, today: string): { error: ErrorCode | null; value?: unknown } {
  switch (rule.kind) {
    case "text": {
      const s = asString(raw);
      if (rule.min && s.length < rule.min) return { error: "minLength" };
      if (s.length > rule.max) return { error: "maxLength" };
      return { error: null, value: s };
    }
    case "fullName": {
      const s = asString(raw).replace(/\s+/g, " ");
      if (s.length < VALIDATION.fullNameMin) return { error: "minLength" };
      if (s.length > VALIDATION.fullNameMax) return { error: "maxLength" };
      return { error: null, value: s };
    }
    case "phone": {
      const s = stripSpaces(asString(raw));
      return VALIDATION.phone.test(s) ? { error: null, value: s } : { error: "phone" };
    }
    case "nationalId": {
      const s = stripSpaces(asString(raw));
      return VALIDATION.nationalId.test(s) ? { error: null, value: s } : { error: "nationalId" };
    }
    case "email": {
      const s = asString(raw);
      return s.length <= 160 && EMAIL.test(s) ? { error: null, value: s.toLowerCase() } : { error: "email" };
    }
    case "int": {
      const n = asInt(raw);
      if (n === null) return { error: "number" };
      if (n < rule.min) return { error: "min" };
      if (n > rule.max) return { error: "max" };
      return { error: null, value: n };
    }
    case "choice": {
      const s = asString(raw);
      return rule.options.includes(s) ? { error: null, value: s } : { error: "choice" };
    }
    case "slug": {
      const s = asString(raw);
      return SLUG.test(s) ? { error: null, value: s } : { error: "slug" };
    }
    case "bool": return { error: null, value: asBool(raw) };
    case "consent": return asBool(raw) ? { error: null, value: true } : { error: "consent" };
    case "last4": {
      const s = asString(raw);
      return VALIDATION.accountLast4.test(s) ? { error: null, value: s } : { error: "accountLast4" };
    }
    case "pastDate": {
      const s = asString(raw);
      if (!ISO_DATE.test(s) || Number.isNaN(Date.parse(s))) return { error: "date" };
      if (s > today) return { error: "futureDate" };
      return { error: null, value: s };
    }
    case "file": {
      const f = raw as FileLike;
      const e = checkFile(f, rule.accept);
      return e ? { error: e } : { error: null, value: f };
    }
  }
}

const todayIso = () => new Date().toISOString().slice(0, 10);

/** Validate one field — used for inline (on blur) validation. */
export function validateField(form: FormKind, name: string, values: Values, today = todayIso()): ErrorCode | null {
  const spec = SCHEMAS[form][name];
  if (!spec) return null;
  const raw = values[name];
  const required = spec.required || (spec.requiredIf?.(values) ?? false);
  if (spec.rule.kind === "consent") return checkRule(spec.rule, raw, today).error;
  if (isEmpty(raw) || (spec.rule.kind === "file" && !(raw as FileLike | null)?.name)) {
    return required ? "required" : null;
  }
  return checkRule(spec.rule, raw, today).error;
}

export interface ValidationResult {
  ok: boolean;
  errors: FieldErrors;
  /** Normalised payload (phones without spaces, numbers parsed, unknown fields dropped). Files are excluded. */
  data: Record<string, unknown>;
}

/** Validate a full submission. `values` may contain strings (FormData), numbers/booleans (JSON) and files. */
export function validateForm(form: FormKind, values: Values, today = todayIso()): ValidationResult {
  const errors: FieldErrors = {};
  const data: Record<string, unknown> = {};
  for (const [name, spec] of Object.entries(SCHEMAS[form])) {
    const error = validateField(form, name, values, today);
    if (error) { errors[name] = error; continue; }
    const raw = values[name];
    if (spec.rule.kind === "file" || spec.send === false) continue;
    if (spec.rule.kind === "bool") { data[name] = asBool(raw); continue; }
    if (isEmpty(raw)) continue;
    if (name === "accountLast4" && !asBool(values.hasAccount)) continue;
    data[name] = checkRule(spec.rule, raw, today).value;
  }
  if (form === "account" || form === "financing" || form === "card") data.type = form;
  return { ok: Object.keys(errors).length === 0, errors, data };
}

/** Reference prefixes from the contract (SubmissionResult). */
export const REFERENCE_PREFIX: Record<FormKind, string> = { account: "ACC", financing: "FIN", card: "CRD", callback: "CB", complaint: "CMP", job: "JOB" };

export function demoReference(form: FormKind, rand: () => number = Math.random, year = new Date().getFullYear()) {
  const n = Math.floor(rand() * 1_000_000).toString().padStart(6, "0");
  return `WTQ-${REFERENCE_PREFIX[form]}-${year}-${n}`;
}

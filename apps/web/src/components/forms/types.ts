import type { FormKind } from "@/lib/forms/validation";

/** Serializable field description (built on the server, rendered by the client form engine). */
export interface FieldSpec {
  name: string;
  kind: "text" | "tel" | "email" | "number" | "select" | "textarea" | "file" | "checkbox" | "date";
  /** Select options — labels already localised on the server. */
  options?: { value: string; label: string }[];
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "tel" | "email" | "decimal";
  /** Latin-only values (phone, ID, numbers) stay LTR inside RTL pages. */
  ltr?: boolean;
  accept?: string;
  full?: boolean;
  /** Render only when another field has this value. */
  showIf?: { field: string; equals: string | boolean };
  maxLength?: number;
  rows?: number;
  max?: string;
}

export type FormValue = string | boolean | File | null;
export type FormValues = Record<string, FormValue>;

export interface PublicFormProps {
  kind: FormKind;
  fields: FieldSpec[];
  initial?: Record<string, string | boolean>;
  /** Extra hidden values sent with the form (e.g. jobSlug). */
  hidden?: Record<string, string>;
  turnstileSiteKey?: string | null;
  nonce?: string;
  /** Heading id the form is labelled by. */
  labelledBy?: string;
}

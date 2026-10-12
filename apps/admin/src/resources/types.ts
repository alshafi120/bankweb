import type { BulkInput, Localized } from "@/types/api";
import type { AnyRecord } from "@/types/admin";
import type { AnyIcon } from "@/components/ui/Icon";

/** Field types understood by the generic form renderer (src/components/forms). */
export type FieldType =
  | "text" | "textarea" | "email" | "url" | "password" | "slug"
  | "localizedText" | "localizedTextarea" | "localizedRichText" | "localizedList"
  | "number" | "money" | "percent"
  | "select" | "multiselect" | "status" | "boolean" | "date" | "datetime"
  | "media" | "icon" | "relation" | "latlng" | "seo"
  | "menuTree" | "permissions";

export type FormTab = "ar" | "en" | "seo" | "settings";

export interface FieldOption { value: string; label: Localized }

export interface FieldDef {
  name: string;
  type: FieldType;
  label: Localized;
  help?: Localized;
  required?: boolean;
  /** Only required when creating (e.g. initial password). */
  requiredOnCreate?: boolean;
  /** Hidden on the edit form (create-only fields). */
  createOnly?: boolean;
  /** Section heading inside the Settings tab. */
  section?: Localized;
  options?: FieldOption[];
  /** relation → another resource's endpoint, the option label key and an optional value key (default "id"). */
  relation?: { endpoint: string; labelKey: string; valueKey?: string };
  /** slug → generate from this localized field's English value. */
  slugFrom?: string;
  min?: number; max?: number; step?: number;
  /** media → accepted kinds. */
  accept?: ("image" | "video" | "pdf" | "document")[];
  placeholder?: string;
  /** Layout: full row or half (two columns on ≥ md). */
  width?: "full" | "half";
  /** Recommended max characters (counter only). */
  maxChars?: number;
  /** Tab override for non-localized fields (default: settings). */
  tab?: FormTab;
}

export type ColumnKind = "title" | "text" | "localized" | "status" | "date" | "datetime" | "money" | "number" | "percent" | "boolean" | "media" | "icon" | "relation" | "badge" | "roles" | "mono" | "count";

export interface ColumnDef {
  key: string;
  label: Localized;
  kind: ColumnKind;
  sortable?: boolean;
  /** For "title": secondary line key (e.g. slug). */
  subKey?: string;
  /** For "relation": the related endpoint + label key (rendered from a lookup). */
  relation?: { endpoint: string; labelKey: string };
  /** For "badge": value → label map. */
  options?: FieldOption[];
  /** Hide on narrow tables (still visible in mobile card view). */
  hideBelow?: "md" | "lg" | "xl";
  align?: "end";
}

export interface FilterDef { key: string; label: Localized; options?: FieldOption[]; relation?: { endpoint: string; labelKey: string } }

/** Extra panels the edit screen mounts beside the generic form. */
export type AsidePanel = "newsWorkflow" | "pageBuilder" | "userSecurity" | "publishInfo";

export type NavGroup = "overview" | "content" | "catalog" | "network" | "requests" | "mediaGroup" | "admin";

export interface ResourceDef {
  key: string;
  endpoint: string;
  /** Permission resource key (`<permission>.view` …). */
  permission: string;
  title: { one: Localized; many: Localized };
  icon: AnyIcon;
  group: NavGroup;
  fields: FieldDef[];
  columns: ColumnDef[];
  /** Field used as the record label (breadcrumbs, confirmations, palette). */
  labelKey: string;
  filters?: FilterDef[];
  /** Status chips above the table. */
  statuses?: string[];
  searchable?: boolean;
  defaultSort: string;
  bulkActions?: BulkInput["action"][];
  csv?: boolean;
  /** Path on the public site for SEO snippet previews, e.g. (r) => `/news/${r.slug}`. */
  publicPath?: (r: AnyRecord) => string;
  aside?: AsidePanel[];
  /** Initial values for "new". */
  defaults: () => Record<string, unknown>;
  /** Hide the "new" button (e.g. menus are fixed by location). */
  noCreate?: boolean;
  noDelete?: boolean;
}

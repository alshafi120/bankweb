import type { Localized, Seo } from "@/types/api";
import type { FieldDef, FieldOption } from "./types";
import { ICON_NAMES } from "@/components/ui/Icon";

export const L = (ar: string, en: string): Localized => ({ ar, en });
export const emptyL = (): Localized => ({ ar: "", en: "" });
export const emptyList = () => ({ ar: [] as string[], en: [] as string[] });
export const emptySeo = (): Seo => ({ title: emptyL(), description: emptyL(), keywords: emptyL(), canonical: null, ogImage: null, noindex: false });

export const ACTIVE = ["active", "inactive"];
export const CONTENT = ["draft", "pending_review", "approved", "scheduled", "published", "archived"];

export const statusOptions = (values: string[], labels: Record<string, Localized> = STATUS_LABELS): FieldOption[] => values.map((v) => ({ value: v, label: labels[v] ?? L(v, v) }));
export const STATUS_LABELS: Record<string, Localized> = {
  draft: L("مسودة", "Draft"), pending_review: L("بانتظار المراجعة", "Pending review"), approved: L("معتمد", "Approved"), published: L("منشور", "Published"),
  scheduled: L("مجدول", "Scheduled"), archived: L("مؤرشف", "Archived"), active: L("نشط", "Active"), inactive: L("غير نشط", "Inactive"), closed: L("مغلق", "Closed"),
};

export const SECTIONS = {
  general: L("عام", "General"), numbers: L("الأرقام والحدود", "Amounts & limits"), display: L("العرض والنشر", "Display & publishing"),
  location: L("الموقع الجغرافي", "Location"), contact: L("التواصل", "Contact"), schedule: L("الجدولة", "Schedule"), access: L("الوصول", "Access"),
};

export const iconOptions: FieldOption[] = ICON_NAMES.map((n) => ({ value: n, label: L(n, n) }));

export const cityRelation = { endpoint: "cities", labelKey: "name" } as const;
export const CITY_OPTIONS: FieldOption[] = [
  ["1", "صنعاء", "Sana'a"], ["2", "عدن", "Aden"], ["3", "تعز", "Taiz"], ["4", "المكلا", "Mukalla"], ["5", "مأرب", "Marib"],
  ["6", "الحديدة", "Hodeidah"], ["7", "إب", "Ibb"], ["8", "سيئون", "Seiyun"], ["9", "ذمار", "Dhamar"], ["10", "حجة", "Hajjah"],
].map(([v, ar, en]) => ({ value: v!, label: L(ar!, en!) }));

/* Reusable field factories */
export const f = {
  slug: (from = "title"): FieldDef => ({ name: "slug", type: "slug", label: L("الرابط المختصر (Slug)", "Slug"), required: true, slugFrom: from, section: SECTIONS.general, help: L("يظهر في رابط الصفحة — أحرف إنجليزية صغيرة وشرطات", "Appears in the URL — lowercase letters and hyphens") }),
  title: (required = true, maxChars = 90): FieldDef => ({ name: "title", type: "localizedText", label: L("العنوان", "Title"), required, maxChars }),
  name: (): FieldDef => ({ name: "name", type: "localizedText", label: L("الاسم", "Name"), required: true }),
  summary: (name = "summary", label = L("الملخص", "Summary"), required = true): FieldDef => ({ name, type: "localizedTextarea", label, required, maxChars: 220 }),
  body: (name = "body", label = L("المحتوى", "Body")): FieldDef => ({ name, type: "localizedRichText", label }),
  status: (values: string[]): FieldDef => ({ name: "status", type: "status", label: L("الحالة", "Status"), required: true, options: statusOptions(values), section: SECTIONS.display, width: "half" }),
  position: (): FieldDef => ({ name: "position", type: "number", label: L("الترتيب", "Position"), min: 0, section: SECTIONS.display, width: "half" }),
  seo: (): FieldDef => ({ name: "seo", type: "seo", label: L("تحسين محركات البحث", "Search engine optimisation"), tab: "seo" }),
  icon: (): FieldDef => ({ name: "icon", type: "icon", label: L("الأيقونة", "Icon"), required: true, section: SECTIONS.general, width: "half" }),
  href: (required = true): FieldDef => ({ name: "href", type: "text", label: L("الرابط في الموقع", "Site link"), required, placeholder: "/accounts", section: SECTIONS.general, width: "half" }),
  list: (name: string, label: Localized): FieldDef => ({ name, type: "localizedList", label }),
};

export const commonCols = {
  status: { key: "status", label: L("الحالة", "Status"), kind: "status" as const, sortable: true },
  updated: { key: "updatedAt", label: L("آخر تحديث", "Updated"), kind: "date" as const, sortable: true, hideBelow: "lg" as const },
  position: { key: "position", label: L("الترتيب", "Pos."), kind: "number" as const, sortable: true, hideBelow: "md" as const },
};

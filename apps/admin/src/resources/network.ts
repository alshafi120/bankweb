import type { FieldDef, ResourceDef } from "./types";
import { ACTIVE, CITY_OPTIONS, L, SECTIONS, commonCols, emptyL, emptyList, emptySeo, f, statusOptions } from "./shared";

const locationFields = (extra: FieldDef[]): FieldDef[] => [
  f.name(), { name: "district", type: "localizedText", label: L("الحي", "District"), required: true },
  { name: "address", type: "localizedTextarea", label: L("العنوان", "Address"), required: true },
  { name: "hours", type: "localizedText", label: L("ساعات العمل", "Opening hours"), required: true },
  f.list("services", L("الخدمات المتاحة", "Available services")), f.slug("name"),
  { name: "cityId", type: "select", label: L("المدينة", "City"), required: true, options: CITY_OPTIONS, section: SECTIONS.location, width: "half" },
  { name: "phone", type: "text", label: L("الهاتف", "Phone"), placeholder: "+967 1 400 400", section: SECTIONS.contact, width: "half" },
  { name: "latlng", type: "latlng", label: L("الإحداثيات", "Coordinates"), required: true, section: SECTIONS.location },
  ...extra, f.status(ACTIVE), f.position(),
];

const locationCols = (nameLabel = L("الاسم", "Name")) => [
  { key: "name", label: nameLabel, kind: "title" as const, sortable: true, subKey: "phone" },
  { key: "cityId", label: L("المدينة", "City"), kind: "badge" as const, options: CITY_OPTIONS, hideBelow: "md" as const },
  { key: "district", label: L("الحي", "District"), kind: "localized" as const, hideBelow: "lg" as const },
  commonCols.status, commonCols.updated,
];

const defaults = (type: string, extra: Record<string, unknown> = {}) => () => ({
  type, name: emptyL(), district: emptyL(), address: emptyL(), hours: emptyL(), services: emptyList(), slug: "", cityId: "1", phone: "",
  lat: 15.3547, lng: 44.2066, status: "active", position: 0, seo: emptySeo(), ...extra,
});

const cityFilter = { key: "cityId", label: L("المدينة", "City"), options: CITY_OPTIONS };

export const branches: ResourceDef = {
  key: "branches", endpoint: "branches", permission: "branches", icon: "branch", group: "network", labelKey: "name",
  title: { one: L("فرع", "Branch"), many: L("الفروع", "Branches") },
  fields: locationFields([{ name: "managerName", type: "text", label: L("مدير الفرع", "Branch manager"), section: SECTIONS.contact, width: "half" }]),
  columns: locationCols(L("الفرع", "Branch")), filters: [cityFilter],
  statuses: ACTIVE, searchable: true, defaultSort: "position", bulkActions: ["activate", "deactivate", "delete"], csv: true,
  publicPath: (r) => `/branches#${String(r.slug)}`, defaults: defaults("branch", { managerName: "" }),
};

export const atms: ResourceDef = {
  key: "atms", endpoint: "atms", permission: "atms", icon: "atm", group: "network", labelKey: "name",
  title: { one: L("صراف آلي", "ATM"), many: L("الصرافات الآلية", "ATMs") },
  fields: locationFields([
    { name: "is24h", type: "boolean", label: L("يعمل 24 ساعة", "Open 24 hours"), section: SECTIONS.general },
    { name: "supportsDeposit", type: "boolean", label: L("يدعم الإيداع", "Supports deposits"), section: SECTIONS.general },
  ]),
  columns: [...locationCols(L("الصراف", "ATM")).slice(0, 2), { key: "is24h", label: L("24 ساعة", "24h"), kind: "boolean", hideBelow: "md" }, { key: "supportsDeposit", label: L("إيداع", "Deposit"), kind: "boolean", hideBelow: "lg" }, commonCols.status],
  filters: [cityFilter], statuses: ACTIVE, searchable: true, defaultSort: "position", bulkActions: ["activate", "deactivate", "delete"], csv: true,
  defaults: defaults("atm", { is24h: true, supportsDeposit: false }),
};

export const agents: ResourceDef = {
  key: "agents", endpoint: "agents", permission: "agents", icon: "store", group: "network", labelKey: "name",
  title: { one: L("وكيل", "Agent"), many: L("الوكلاء", "Agents") },
  fields: locationFields([{ name: "agentCode", type: "text", label: L("رمز الوكيل", "Agent code"), required: true, placeholder: "AG-1040", section: SECTIONS.general, width: "half" }]),
  columns: [{ key: "agentCode", label: L("الرمز", "Code"), kind: "mono", sortable: true }, ...locationCols(L("الوكيل", "Agent")).slice(0, 2), commonCols.status, commonCols.updated],
  filters: [cityFilter], statuses: ACTIVE, searchable: true, defaultSort: "position", bulkActions: ["activate", "deactivate", "delete"], csv: true,
  defaults: defaults("agent", { agentCode: "" }),
};

const EMPLOYMENT = [
  { value: "full_time", label: L("دوام كامل", "Full time") }, { value: "part_time", label: L("دوام جزئي", "Part time") },
  { value: "contract", label: L("عقد", "Contract") }, { value: "internship", label: L("تدريب", "Internship") },
];

export const jobs: ResourceDef = {
  key: "jobs", endpoint: "jobs", permission: "jobs", icon: "briefcase", group: "requests", labelKey: "title",
  title: { one: L("وظيفة", "Job"), many: L("الوظائف", "Jobs") },
  fields: [
    f.title(true, 70), { name: "department", type: "localizedText", label: L("الإدارة", "Department"), required: true }, f.summary(),
    f.body("description", L("الوصف الوظيفي", "Job description")), f.list("requirements", L("المتطلبات", "Requirements")), f.slug(),
    { name: "cityId", type: "select", label: L("المدينة", "City"), required: true, options: CITY_OPTIONS, section: SECTIONS.general, width: "half" },
    { name: "employmentType", type: "select", label: L("نوع التوظيف", "Employment type"), required: true, options: EMPLOYMENT, section: SECTIONS.general, width: "half" },
    { name: "closesAt", type: "date", label: L("آخر موعد للتقديم", "Closing date"), required: true, section: SECTIONS.schedule, width: "half" },
    { ...f.status(["active", "inactive", "closed"]), options: statusOptions(["active", "inactive", "closed"]) },
  ],
  columns: [
    { key: "title", label: L("الوظيفة", "Job"), kind: "title", sortable: true, subKey: "slug" },
    { key: "department", label: L("الإدارة", "Department"), kind: "localized", hideBelow: "md" },
    { key: "employmentType", label: L("النوع", "Type"), kind: "badge", options: EMPLOYMENT, hideBelow: "lg" },
    { key: "closesAt", label: L("يغلق", "Closes"), kind: "date", sortable: true }, commonCols.status,
  ],
  filters: [{ key: "employmentType", label: L("النوع", "Type"), options: EMPLOYMENT }, cityFilter],
  statuses: ["active", "inactive", "closed"], searchable: true, defaultSort: "closesAt", bulkActions: ["activate", "deactivate", "delete"], csv: true,
  publicPath: (r) => `/careers/${String(r.slug)}`,
  defaults: () => ({ title: emptyL(), department: emptyL(), summary: emptyL(), description: emptyL(), requirements: emptyList(), slug: "", cityId: "1", employmentType: "full_time", closesAt: null, status: "active" }),
};

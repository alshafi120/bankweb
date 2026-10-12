import type { ResourceDef } from "./types";
import { L, SECTIONS } from "./shared";
import { ROLES } from "@/lib/rbac";

const ROLE_LABELS: Record<string, [string, string]> = {
  super_admin: ["مدير النظام", "Super admin"], content_manager: ["مدير المحتوى", "Content manager"], news_manager: ["مدير الأخبار", "News manager"],
  marketing_manager: ["مدير التسويق", "Marketing manager"], hr_manager: ["مدير الموارد البشرية", "HR manager"], branch_manager: ["مدير الفروع", "Branch manager"],
  customer_service: ["خدمة العملاء", "Customer service"], reviewer: ["مراجع", "Reviewer"], viewer: ["مشاهد", "Viewer"],
};
export const ROLE_OPTIONS = ROLES.map((r) => ({ value: r, label: L(ROLE_LABELS[r]![0], ROLE_LABELS[r]![1]) }));

export const users: ResourceDef = {
  key: "users", endpoint: "users", permission: "users", icon: "users", group: "admin", labelKey: "name",
  title: { one: L("مستخدم", "User"), many: L("المستخدمون", "Users") },
  fields: [
    { name: "name", type: "text", label: L("الاسم الكامل", "Full name"), required: true, section: SECTIONS.general, width: "half", tab: "settings" },
    { name: "username", type: "text", label: L("اسم المستخدم", "Username"), required: true, section: SECTIONS.general, width: "half", tab: "settings" },
    { name: "email", type: "email", label: L("البريد الإلكتروني", "Email"), required: true, section: SECTIONS.general, width: "half", tab: "settings" },
    { name: "password", type: "password", label: L("كلمة المرور الأولية", "Initial password"), requiredOnCreate: true, createOnly: true, section: SECTIONS.general, width: "half", tab: "settings",
      help: L("≥ 12 حرفاً مع أحرف كبيرة وصغيرة وأرقام ورموز. سيُطلب تغييرها عند أول دخول.", "≥ 12 chars with upper, lower, digits and symbols. Must be changed at first sign-in.") },
    { name: "roles", type: "multiselect", label: L("الأدوار", "Roles"), required: true, options: ROLE_OPTIONS, section: SECTIONS.access, tab: "settings", help: L("يمكن للمستخدم امتلاك أكثر من دور", "A user can hold more than one role") },
    { name: "isActive", type: "boolean", label: L("الحساب نشط", "Account active"), section: SECTIONS.access, tab: "settings" },
  ],
  columns: [
    { key: "name", label: L("المستخدم", "User"), kind: "title", sortable: true, subKey: "email" },
    { key: "roles", label: L("الأدوار", "Roles"), kind: "roles" },
    { key: "twoFactorEnabled", label: L("2FA", "2FA"), kind: "boolean", hideBelow: "md" },
    { key: "isActive", label: L("نشط", "Active"), kind: "boolean", sortable: true },
    { key: "lastLoginAt", label: L("آخر دخول", "Last sign-in"), kind: "datetime", sortable: true, hideBelow: "lg" },
  ],
  filters: [{ key: "role", label: L("الدور", "Role"), options: ROLE_OPTIONS }, { key: "isActive", label: L("الحالة", "Status"), options: [{ value: "true", label: L("نشط", "Active") }, { value: "false", label: L("معطل", "Disabled") }] }],
  searchable: true, defaultSort: "name", bulkActions: ["activate", "deactivate"], aside: ["userSecurity"],
  defaults: () => ({ name: "", username: "", email: "", password: "", roles: ["viewer"], isActive: true }),
};

export const roles: ResourceDef = {
  key: "roles", endpoint: "roles", permission: "roles", icon: "role", group: "admin", labelKey: "label",
  title: { one: L("دور", "Role"), many: L("الأدوار والصلاحيات", "Roles & permissions") },
  fields: [
    { name: "label", type: "localizedText", label: L("اسم الدور", "Role label"), required: true },
    { name: "name", type: "slug", label: L("المعرّف", "Identifier"), required: true, slugFrom: "label", section: SECTIONS.general, help: L("معرّف ثابت يُستخدم في الصلاحيات", "Stable identifier used by the API") },
    { name: "permissions", type: "permissions", label: L("مصفوفة الصلاحيات", "Permission matrix"), tab: "settings" },
  ],
  columns: [
    { key: "label", label: L("الدور", "Role"), kind: "title", sortable: true, subKey: "name" },
    { key: "permissions", label: L("الصلاحيات", "Permissions"), kind: "count" },
    { key: "usersCount", label: L("المستخدمون", "Users"), kind: "number", sortable: true, align: "end" },
  ],
  searchable: true, defaultSort: "id",
  defaults: () => ({ label: { ar: "", en: "" }, name: "", permissions: [] }),
};

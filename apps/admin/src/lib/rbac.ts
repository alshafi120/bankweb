import type { Permission, Role } from "@/types/api";

/** Abilities and resources from docs/API.md → "الصلاحيات". */
export const ABILITIES = ["view", "create", "update", "delete", "publish", "approve", "export"] as const;
export type Ability = (typeof ABILITIES)[number];

export const PERMISSION_RESOURCES = [
  "dashboard", "pages", "news", "news-categories", "services", "products", "financing-products", "cards", "offers", "banners",
  "faqs", "menus", "seo", "branches", "atms", "agents", "jobs", "media", "applications", "contact-requests", "complaints",
  "job-applications", "users", "roles", "settings", "audit-logs",
] as const;
export type PermissionResource = (typeof PERMISSION_RESOURCES)[number];

/** Which abilities make sense per resource (the matrix greys out the others). */
export const RESOURCE_ABILITIES: Record<PermissionResource, readonly Ability[]> = {
  dashboard: ["view"],
  pages: ["view", "create", "update", "delete", "publish", "approve"],
  news: ["view", "create", "update", "delete", "publish", "approve"],
  "news-categories": ["view", "create", "update", "delete"],
  services: ["view", "create", "update", "delete", "publish"],
  products: ["view", "create", "update", "delete", "publish"],
  "financing-products": ["view", "create", "update", "delete", "publish"],
  cards: ["view", "create", "update", "delete", "publish"],
  offers: ["view", "create", "update", "delete", "publish"],
  banners: ["view", "create", "update", "delete", "publish"],
  faqs: ["view", "create", "update", "delete", "publish"],
  menus: ["view", "create", "update", "delete", "publish"],
  seo: ["view", "create", "update", "delete"],
  branches: ["view", "create", "update", "delete", "publish"],
  atms: ["view", "create", "update", "delete", "publish"],
  agents: ["view", "create", "update", "delete", "publish"],
  jobs: ["view", "create", "update", "delete", "publish", "export"],
  media: ["view", "create", "update", "delete"],
  applications: ["view", "update", "export"],
  "contact-requests": ["view", "update", "export"],
  complaints: ["view", "update", "export"],
  "job-applications": ["view", "update", "export"],
  users: ["view", "create", "update", "delete"],
  roles: ["view", "create", "update", "delete"],
  settings: ["view", "update"],
  "audit-logs": ["view", "export"],
};

export const ALL_PERMISSIONS: Permission[] = PERMISSION_RESOURCES.flatMap((r) => RESOURCE_ABILITIES[r].map((a) => `${r}.${a}`));

const all = (resources: readonly string[], abilities: readonly Ability[]) =>
  resources.flatMap((r) => abilities.filter((a) => (RESOURCE_ABILITIES[r as PermissionResource] ?? ABILITIES).includes(a)).map((a) => `${r}.${a}`));

const CRUDP = ["view", "create", "update", "delete", "publish"] as const;

/** Default role → permissions (mirrors the matrix in docs/API.md; the server is the authority). */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: ALL_PERMISSIONS,
  content_manager: [
    ...all(["pages", "services", "products", "financing-products", "cards", "faqs", "menus", "media", "banners", "seo"], CRUDP),
    "settings.view", "dashboard.view",
  ],
  news_manager: [...all(["news", "news-categories", "media"], [...CRUDP, "approve"]), "dashboard.view"],
  marketing_manager: [...all(["offers", "banners", "media", "seo"], ABILITIES), "news.view", "news.create", "news.update", "dashboard.view"],
  hr_manager: [...all(["jobs"], ABILITIES), "job-applications.view", "job-applications.update", "job-applications.export", "dashboard.view"],
  branch_manager: [...all(["branches", "atms", "agents"], ABILITIES), "dashboard.view"],
  customer_service: [...all(["applications", "contact-requests", "complaints"], ["view", "update"]), "dashboard.view"],
  reviewer: ["news.view", "news.approve", "pages.view", "pages.approve", "dashboard.view"],
  viewer: PERMISSION_RESOURCES.filter((r) => !["users", "roles", "audit-logs", "settings"].includes(r)).map((r) => `${r}.view`),
};

export const ROLES: Role[] = [
  "super_admin", "content_manager", "news_manager", "marketing_manager", "hr_manager", "branch_manager", "customer_service", "reviewer", "viewer",
];

export function permissionsFor(roles: Role[]): Permission[] {
  if (roles.includes("super_admin")) return ALL_PERMISSIONS;
  return [...new Set(roles.flatMap((r) => ROLE_PERMISSIONS[r] ?? []))];
}

/** super_admin passes every check (mirrors Gate::before on the server). */
export function hasPermission(user: { roles: Role[]; permissions: Permission[] } | null, permission: Permission): boolean {
  if (!user) return false;
  if (user.roles.includes("super_admin")) return true;
  return user.permissions.includes(permission);
}

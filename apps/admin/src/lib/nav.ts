import type { AnyIcon } from "@/components/ui/Icon";
import type { NavGroup } from "@/resources/types";

export interface NavItem { key: string; path: string; icon: AnyIcon; permission: string; group: NavGroup }

/** Sidebar / command palette entries. Only items whose `<permission>` the user has are shown. */
export const NAV: NavItem[] = [
  { key: "dashboard", path: "", icon: "dashboard", permission: "dashboard.view", group: "overview" },
  { key: "pages", path: "/pages", icon: "page", permission: "pages.view", group: "content" },
  { key: "news", path: "/news", icon: "news", permission: "news.view", group: "content" },
  { key: "news-categories", path: "/news-categories", icon: "tag", permission: "news-categories.view", group: "content" },
  { key: "banners", path: "/banners", icon: "banner", permission: "banners.view", group: "content" },
  { key: "faqs", path: "/faqs", icon: "help", permission: "faqs.view", group: "content" },
  { key: "faq-categories", path: "/faq-categories", icon: "tag", permission: "faqs.view", group: "content" },
  { key: "menus", path: "/menus", icon: "list", permission: "menus.view", group: "content" },
  { key: "services", path: "/services", icon: "layers", permission: "services.view", group: "catalog" },
  { key: "products", path: "/products", icon: "account", permission: "products.view", group: "catalog" },
  { key: "financing-products", path: "/financing-products", icon: "financing", permission: "financing-products.view", group: "catalog" },
  { key: "cards", path: "/cards", icon: "card", permission: "cards.view", group: "catalog" },
  { key: "offers", path: "/offers", icon: "sparkle", permission: "offers.view", group: "catalog" },
  { key: "branches", path: "/branches", icon: "branch", permission: "branches.view", group: "network" },
  { key: "atms", path: "/atms", icon: "atm", permission: "atms.view", group: "network" },
  { key: "agents", path: "/agents", icon: "store", permission: "agents.view", group: "network" },
  { key: "applications", path: "/applications", icon: "inbox", permission: "applications.view", group: "requests" },
  { key: "contact-requests", path: "/contact-requests", icon: "message", permission: "contact-requests.view", group: "requests" },
  { key: "complaints", path: "/complaints", icon: "alert", permission: "complaints.view", group: "requests" },
  { key: "jobs", path: "/jobs", icon: "briefcase", permission: "jobs.view", group: "requests" },
  { key: "job-applications", path: "/job-applications", icon: "users", permission: "job-applications.view", group: "requests" },
  { key: "media", path: "/media", icon: "image", permission: "media.view", group: "mediaGroup" },
  { key: "users", path: "/users", icon: "users", permission: "users.view", group: "admin" },
  { key: "roles", path: "/roles", icon: "role", permission: "roles.view", group: "admin" },
  { key: "audit-logs", path: "/audit-logs", icon: "history", permission: "audit-logs.view", group: "admin" },
  { key: "settings", path: "/settings", icon: "settings", permission: "settings.view", group: "admin" },
];

export const NAV_GROUPS: NavGroup[] = ["overview", "content", "catalog", "network", "requests", "mediaGroup", "admin"];

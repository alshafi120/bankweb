import type { ResourceDef } from "./types";
import { banners, faqCategories, faqs, menus, news, newsCategories, pages } from "./content";
import { cards, financingProducts, offers, products, services } from "./catalog";
import { agents, atms, branches, jobs } from "./network";
import { roles, users } from "./admin";

/** Registry of every config-driven CRUD resource (generic list/new/edit routes). */
export const RESOURCES: ResourceDef[] = [
  pages, news, newsCategories, banners, faqs, faqCategories, menus,
  services, products, financingProducts, cards, offers,
  branches, atms, agents, jobs,
  users, roles,
];

const byKey = new Map(RESOURCES.map((r) => [r.key, r]));
export const getResource = (key: string): ResourceDef | undefined => byKey.get(key);
export type { ResourceDef } from "./types";

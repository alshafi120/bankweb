/**
 * Admin-side record shapes for the CRUD resources.
 * `src/types/api.ts` (copy of packages/api-types) defines the public shapes and admin primitives but not
 * per-resource admin records; these are COMPOSED from its primitives (Localized, Seo, MediaRef, statuses…)
 * following docs/DATABASE.md columns in camelCase. Nothing here redefines a contract shape.
 */
import type {
  ActiveStatus, AdminApplication, AdminUser, BlockDataMap, BlockType, CardProduct, ContentStatus, FinancingProduct,
  HomeSectionType, IconName, Job, Localized, LocalizedList, MediaRef, MenuItem, Role, Seo, ServiceType, SiteSettings, AccountProduct,
} from "./api";

export interface Timestamps { createdAt: string; updatedAt: string }

/** Generic record handled by the resource framework. */
export type AnyRecord = { id: number } & Record<string, unknown>;

/** Built-in home blocks are stored as `home:<type>` so they never collide with generic blocks of the same name (hero, faq, cta). */
export type HomeBlockKey = `home:${HomeSectionType}`;
export type SectionType = BlockType | HomeBlockKey;

export interface AdminPageSection {
  id: number;
  type: SectionType;
  data: BlockDataMap[BlockType] | Record<string, never>;
  isVisible: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

export interface AdminPage extends Timestamps {
  id: number; slug: string; title: Localized; summary: Localized | null; template: "default" | "home";
  status: ContentStatus; publishAt: string | null; publishedAt: string | null; seo: Seo; sections: AdminPageSection[];
}

export interface AdminNews extends Timestamps {
  id: number; slug: string; categoryId: number | null; title: Localized; excerpt: Localized; content: Localized;
  featuredMedia: MediaRef | null; author: { id: number; name: string } | null; status: ContentStatus;
  publishAt: string | null; publishedAt: string | null; reviewedBy: { id: number; name: string } | null;
  reviewedAt: string | null; reviewNote: string | null; seo: Seo;
}

export interface AdminRole { id: number; name: Role; label: Localized; description: string | null; permissions: string[]; usersCount: number }
export interface AdminUserRecord extends AdminUser { lockedUntil: string | null; failedLoginAttempts: number }

export interface AdminLocation extends Timestamps {
  id: number; slug: string; type: ServiceType; cityId: number | null; name: Localized; district: Localized; address: Localized;
  phone: string; hours: Localized; services: LocalizedList; lat: number; lng: number; status: ActiveStatus; position: number;
}

export interface AdminMenu { id: number; location: "header" | "footer"; name: string; items: MenuItem[]; updatedAt: string }

/** Inbox records (applications · contact-requests · complaints · job-applications) share the AdminApplication shape. */
export type InboxKind = "applications" | "contact-requests" | "complaints" | "job-applications";
export type InboxRecord = Omit<AdminApplication, "type"> & { type: AdminApplication["type"] | "contact" | "complaint" | "job" };

export type AdminSettings = SiteSettings & { defaultSeo: Seo };

export interface PermissionGroup { resource: string; abilities: string[] }

export interface SignedUrl { url: string; expiresAt: string; filename: string }

export type { ActiveStatus, ContentStatus, IconName, MediaRef, Seo, Localized, LocalizedList, CardProduct, FinancingProduct, Job, AccountProduct };

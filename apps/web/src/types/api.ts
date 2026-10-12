/**
 * Withaq Bank — API contract (single source of truth).
 * Used by: apps/web (public site), apps/admin (dashboard), apps/api (Laravel Resources must emit exactly these shapes).
 * Conventions:
 *  - JSON keys are camelCase in public API responses (/api/v1) and in admin API responses AND requests (/api/admin/v1).
 *  - Every user-facing text field is bilingual: Localized = { ar, en }.
 *  - Money is integer YER. Dates are ISO-8601 strings (dates "YYYY-MM-DD", timestamps with offset).
 *  - Envelope: single → { data: T }, list → { data: T[], meta?: PageMeta }.
 *  - Validation error 422: { message: string, errors: Record<string, string[]> } (Laravel default; field keys camelCase).
 */

/* ───────────────────────── Primitives ───────────────────────── */

export type Locale = "ar" | "en";
export type Localized = Record<Locale, string>;
export type LocalizedList = Record<Locale, string[]>;

export interface PageMeta { currentPage: number; lastPage: number; perPage: number; total: number }
export interface Paginated<T> { data: T[]; meta: PageMeta }

export type IconName =
  | "account" | "financing" | "transfer" | "card" | "payment" | "digital"
  | "send" | "receive" | "branch" | "shield" | "network" | "speed" | "eye" | "support"
  | "mobile" | "web" | "wallet" | "qr";

export interface MediaRef {
  id: number;
  url: string;          // absolute public URL (CDN)
  alt: Localized;
  mime: string;
  width?: number | null;
  height?: number | null;
}

export interface Seo {
  title: Localized;
  description: Localized;
  keywords?: Localized;
  canonical?: string | null;
  ogImage?: MediaRef | null;
  noindex?: boolean;
}

export interface LinkCta { label: Localized; href: string }

/* ───────────────────────── Public content ───────────────────────── */

export interface SiteSettings {
  bankName: Localized;
  phone: string;
  tollFree: string;
  email: string;
  address: Localized;
  internetBankingUrl: string;
  social: { facebook: string; instagram: string; x: string; linkedin: string; youtube: string };
  appStores: { googlePlay: string; appStore: string };
  turnstileSiteKey?: string | null;   // public key only
}

export interface MenuItem { id: number; label: Localized; href: string; children?: MenuItem[] }

export interface Service { id: string; icon: IconName; title: Localized; summary: Localized; href: string; body?: Localized | null }
export interface CustomerNeed { id: string; icon: IconName; label: Localized; href: string }

export type AccountType = "current" | "savings" | "investment" | "business";
export interface AccountProduct {
  id: string;                 // slug, e.g. "current"
  accountType: AccountType;
  name: Localized;
  tagline: Localized;
  features: LocalizedList;
  requirements: LocalizedList;
  minimumBalance: number | null;
  currency: "YER";
  href: string;
}

export interface FinancingProduct {
  id: string;                 // slug
  name: Localized;
  summary: Localized;
  body?: Localized | null;    // HTML (sanitized)
  maxAmount: number;
  maxMonths: number;
  annualProfitRate: number;   // indicative, %
  requirements?: LocalizedList;
}

export interface DigitalChannel { id: string; icon: IconName; name: Localized; summary: Localized }

export interface CardProduct {
  id: string;                 // slug
  name: Localized;
  summary: Localized;
  network: "Visa" | "Mastercard" | "Local";
  tone: "jade" | "saffron" | "lapis" | "graphite";
  features?: LocalizedList;
  fees?: Localized | null;
  image?: string;
}

export type ServiceType = "branch" | "atm" | "agent";
export interface Location {
  id: string;
  type: ServiceType;
  name: Localized;
  city: Localized;
  district: Localized;
  address: Localized;
  phone: string;
  hours: Localized;
  services: LocalizedList;
  lat: number;
  lng: number;
}

export interface NewsItem {
  id: string;
  slug: string;
  title: Localized;
  excerpt: Localized;
  category: Localized;
  categorySlug?: string;
  publishedAt: string;
  image: string;              // URL or "" → client renders generated cover
}
export interface NewsDetail extends NewsItem { content: Localized; author: string; seo: Seo }
export interface NewsCategory { slug: string; name: Localized }

export interface Offer { id: string; title: Localized; details: Localized; startsAt: string; endsAt: string; image: string; href: string }
export interface Stat { id: string; value: number; suffix?: string; label: Localized }
export interface Reason { id: string; icon: IconName; title: Localized; summary: Localized }
export interface Faq { id: string; question: Localized; answer: Localized }
export interface FaqGroup { category: { slug: string; name: Localized }; items: Faq[] }

export interface Job {
  id: string;
  slug: string;
  title: Localized;
  department: Localized;
  city: Localized;
  employmentType: "full_time" | "part_time" | "contract" | "internship";
  closesAt: string;
  summary: Localized;
  description?: Localized;     // HTML, detail only
  requirements?: LocalizedList; // detail only
}

export interface HomeContent {
  settings: SiteSettings;
  services: Service[];
  needs: CustomerNeed[];
  accounts: AccountProduct[];
  financing: FinancingProduct[];
  digital: DigitalChannel[];
  cards: CardProduct[];
  stats: Stat[];
  locations: Location[];
  news: NewsItem[];
  offers: Offer[];
  reasons: Reason[];
  reasonStats: Stat[];
  faqs: Faq[];
  layout?: HomeSectionType[]; // ordered, visible sections from the page builder; absent → default order
}

/* ───────────────────────── Page builder ───────────────────────── */

/** Built-in home blocks (data comes from catalog modules, block `data` is empty {}). */
export type HomeSectionType =
  | "hero" | "services" | "needs" | "accounts" | "financing" | "digital" | "cards"
  | "network" | "news" | "offers" | "why" | "app" | "faq" | "cta";

/** Generic CMS blocks usable on any page. */
export interface BlockDataMap {
  hero: { title: Localized; subtitle?: Localized; image?: MediaRef | null; primary?: LinkCta | null; secondary?: LinkCta | null };
  text: { heading?: Localized | null; body: Localized /* sanitized HTML */ };
  image: { image: MediaRef; caption?: Localized | null };
  cards: { heading?: Localized | null; items: { icon?: IconName; title: Localized; body: Localized; href?: string | null }[] };
  features: { heading?: Localized | null; body?: Localized | null; items: { icon: IconName; title: Localized; body: Localized }[] };
  statistics: { heading?: Localized | null; items: { value: number; suffix?: string; label: Localized }[] };
  faq: { heading?: Localized | null; items: { question: Localized; answer: Localized }[] };
  cta: { title: Localized; body?: Localized | null; primary: LinkCta; secondary?: LinkCta | null };
  gallery: { heading?: Localized | null; images: MediaRef[] };
  video: { heading?: Localized | null; url: string; poster?: MediaRef | null };
  map: { heading?: Localized | null; type?: ServiceType | null; city?: string | null };
  people: { heading?: Localized | null; items: { name: Localized; role: Localized; bio?: Localized | null; photo?: MediaRef | null }[] }; // board / executives
  documents: { heading?: Localized | null; items: { title: Localized; year?: number | null; file: MediaRef }[] };       // reports, governance PDFs
}
export type BlockType = keyof BlockDataMap;

export type PageSection = {
  [K in BlockType]: { id: number; type: K; data: BlockDataMap[K] }
}[BlockType];

export interface CmsPage {
  slug: string;               // "about", "board", "governance", "csr", "reports", "privacy", "terms", "executive-management" …
  title: Localized;
  summary?: Localized | null;
  seo: Seo;
  sections: PageSection[];    // only visible + currently scheduled, ordered
  updatedAt: string;
}

/* ───────────────────────── Public forms (POST) ───────────────────────── */

/** Fields every public form sends in addition to its own. */
export interface AntiSpam {
  website?: string;           // honeypot — must be empty
  turnstileToken?: string;    // Cloudflare Turnstile token (verified server-side when configured)
  locale: Locale;
}

export type YemeniCity = string; // free text from a CMS-managed list

export interface AccountApplicationInput extends AntiSpam {
  type: "account";
  fullName: string; nationalId: string; phone: string; email?: string; city: YemeniCity;
  accountType: AccountType; branchId?: string | null; consent: true;
}
export interface FinancingApplicationInput extends AntiSpam {
  type: "financing";
  fullName: string; nationalId: string; phone: string; email?: string; city: YemeniCity;
  financingProductId: string; amount: number; months: number; monthlyIncome: number;
  employer?: string; notes?: string; consent: true;
}
export interface CardApplicationInput extends AntiSpam {
  type: "card";
  fullName: string; nationalId: string; phone: string; email?: string; city: YemeniCity;
  cardId: string; hasAccount: boolean; accountLast4?: string | null; consent: true;
}
export type ApplicationInput = AccountApplicationInput | FinancingApplicationInput | CardApplicationInput;

export interface ContactInput extends AntiSpam {
  fullName: string; phone: string; email?: string;
  subject: "general" | "accounts" | "financing" | "cards" | "digital" | "other";
  message: string; preferredTime?: "morning" | "afternoon" | "evening" | null;
}

/** multipart/form-data (optional `attachment`: pdf/jpg/png ≤ 5 MB) */
export interface ComplaintInput extends AntiSpam {
  fullName: string; phone: string; email?: string; nationalId?: string;
  category: "service" | "transaction" | "staff" | "digital" | "fees" | "other";
  branchId?: string | null; transactionDate?: string | null; description: string; consent: true;
}

/** multipart/form-data (required `cv`: pdf ≤ 5 MB) */
export interface JobApplicationInput extends AntiSpam {
  fullName: string; phone: string; email: string; city: YemeniCity;
  education: string; experienceYears: number; coverLetter?: string; consent: true;
}

/** 201 response for every public form. Reference prefixes: ACC FIN CRD CB CMP JOB. e.g. "WTQ-FIN-2026-000412" */
export interface SubmissionResult { reference: string }

/** Validation rules shared by web (client-side) and API (server-side). */
export const VALIDATION = {
  phone: /^(\+?967)?7[01378]\d{7}$/,          // Yemeni mobile, spaces stripped before testing
  nationalId: /^\d{8,12}$/,
  accountLast4: /^\d{4}$/,
  fullNameMin: 6, fullNameMax: 120,
  messageMin: 20, messageMax: 2000,
  uploadMaxBytes: 5 * 1024 * 1024,
} as const;

/* ───────────────────────── Admin API ───────────────────────── */

export type Role =
  | "super_admin" | "content_manager" | "news_manager" | "marketing_manager" | "hr_manager"
  | "branch_manager" | "customer_service" | "reviewer" | "viewer";

/** "<resource>.<ability>" */
export type Permission = string;

export interface AdminUser {
  id: number; name: string; email: string; username: string;
  roles: Role[]; permissions: Permission[];
  twoFactorEnabled: boolean; isActive: boolean;
  lastLoginAt: string | null; createdAt: string;
}

export interface LoginInput { login: string /* email or username */; password: string; remember?: boolean }
export interface LoginResult { twoFactorRequired: boolean; user: AdminUser | null }
export interface TwoFactorSetup { secret: string; otpauthUrl: string; qrSvg: string }
export interface AdminSession { id: string; ipAddress: string; userAgent: string; lastActiveAt: string; current: boolean }

export type ContentStatus = "draft" | "pending_review" | "approved" | "published" | "scheduled" | "archived";
export type ActiveStatus = "active" | "inactive";
export type ApplicationStatus = "new" | "in_review" | "contacted" | "approved" | "rejected" | "closed";

export interface ListQuery {
  page?: number; perPage?: number;   // perPage ≤ 100, default 15
  search?: string;
  status?: string;
  sort?: string;                     // "createdAt" or "-createdAt" (desc)
  [filter: `filter[${string}]`]: string | undefined;
}

export interface BulkInput { action: "delete" | "publish" | "unpublish" | "archive" | "activate" | "deactivate"; ids: number[] }
export interface BulkResult { affected: number }

export interface AuditLogEntry {
  id: number;
  user: { id: number; name: string } | null;
  action: "login" | "logout" | "login_failed" | "create" | "update" | "delete" | "publish" | "approve" | "reject" | "change_permissions" | "export" | "lockout";
  resourceType: string | null; resourceId: string | null; resourceLabel: string | null;
  changes: { before?: Record<string, unknown>; after?: Record<string, unknown> } | null;
  ipAddress: string; userAgent: string; createdAt: string;
}

export interface AdminApplication {
  id: number; reference: string; type: "account" | "financing" | "card";
  status: ApplicationStatus; fullName: string; phoneMasked: string; nationalIdMasked: string; email: string | null;
  city: string; locale: Locale; assignedTo: { id: number; name: string } | null;
  details: Record<string, unknown>;   // type-specific (amount, months, cardId, accountType …)
  notes: { id: number; body: string; author: string; createdAt: string }[];
  createdAt: string; updatedAt: string;
}

export interface MediaItem {
  id: number; url: string; filename: string; mime: string; kind: "image" | "video" | "pdf" | "document";
  size: number; width: number | null; height: number | null; alt: Localized;
  uploader: { id: number; name: string } | null; createdAt: string;
}

export interface DashboardData {
  kpis: {
    visitors: number; applications: number; accountRequests: number; financingRequests: number;
    cardRequests: number; complaints: number; news: number; jobs: number; branches: number;
  };
  charts: {
    visits: { date: string; count: number }[];                                        // last 30 days
    dailyApplications: { date: string; account: number; financing: number; card: number }[]; // last 14 days
    topServices: { label: string; count: number }[];
    topPages: { path: string; count: number }[];
    applicationsByCity: { city: string; count: number }[];
    trafficSources: { source: string; count: number }[];
  };
}

import type { ResourceDef } from "./types";
import { ACTIVE, L, SECTIONS, commonCols, emptyL, emptyList, emptySeo, f } from "./shared";

export const services: ResourceDef = {
  key: "services", endpoint: "services", permission: "services", icon: "layers", group: "catalog", labelKey: "title",
  title: { one: L("خدمة", "Service"), many: L("الخدمات", "Services") },
  fields: [f.title(true, 40), f.summary(), f.body(), f.slug(), f.icon(), f.href(), f.status(ACTIVE), f.position(), f.seo()],
  columns: [
    { key: "icon", label: L("أيقونة", "Icon"), kind: "icon" },
    { key: "title", label: L("الخدمة", "Service"), kind: "title", sortable: true, subKey: "href" },
    commonCols.position, commonCols.status, commonCols.updated,
  ],
  statuses: ACTIVE, searchable: true, defaultSort: "position", bulkActions: ["activate", "deactivate", "delete"], csv: true,
  publicPath: (r) => String(r.href ?? "/"),
  defaults: () => ({ title: emptyL(), summary: emptyL(), body: emptyL(), slug: "", icon: "account", href: "", status: "active", position: 0, seo: emptySeo() }),
};

const ACCOUNT_TYPES = [
  { value: "current", label: L("جاري", "Current") }, { value: "savings", label: L("توفير", "Savings") },
  { value: "investment", label: L("استثماري", "Investment") }, { value: "business", label: L("شركات", "Business") },
];

export const products: ResourceDef = {
  key: "products", endpoint: "products", permission: "products", icon: "account", group: "catalog", labelKey: "name",
  title: { one: L("حساب", "Account product"), many: L("الحسابات", "Account products") },
  fields: [
    f.name(), { name: "tagline", type: "localizedText", label: L("الشعار القصير", "Tagline"), required: true, maxChars: 60 },
    f.list("features", L("المزايا", "Features")), f.list("requirements", L("المتطلبات", "Requirements")), f.slug("name"),
    { name: "accountType", type: "select", label: L("نوع الحساب", "Account type"), required: true, options: ACCOUNT_TYPES, section: SECTIONS.general, width: "half" },
    f.href(),
    { name: "minimumBalance", type: "money", label: L("الحد الأدنى للرصيد", "Minimum balance"), min: 0, section: SECTIONS.numbers, width: "half", help: L("اتركه فارغاً إن لم يوجد حد أدنى", "Leave empty when there is no minimum") },
    f.status(ACTIVE), f.position(), f.seo(),
  ],
  columns: [
    { key: "name", label: L("الحساب", "Account"), kind: "title", sortable: true, subKey: "slug" },
    { key: "accountType", label: L("النوع", "Type"), kind: "badge", options: ACCOUNT_TYPES, hideBelow: "md" },
    { key: "minimumBalance", label: L("الحد الأدنى", "Min. balance"), kind: "money", sortable: true, align: "end", hideBelow: "md" },
    commonCols.status, commonCols.updated,
  ],
  filters: [{ key: "accountType", label: L("النوع", "Type"), options: ACCOUNT_TYPES }],
  statuses: ACTIVE, searchable: true, defaultSort: "position", bulkActions: ["activate", "deactivate", "delete"], csv: true,
  publicPath: (r) => `/accounts/${String(r.slug)}`,
  defaults: () => ({ name: emptyL(), tagline: emptyL(), features: emptyList(), requirements: emptyList(), slug: "", accountType: "current", href: "", minimumBalance: null, currency: "YER", status: "active", position: 0, seo: emptySeo() }),
};

export const financingProducts: ResourceDef = {
  key: "financing-products", endpoint: "financing-products", permission: "financing-products", icon: "financing", group: "catalog", labelKey: "name",
  title: { one: L("منتج تمويل", "Financing product"), many: L("منتجات التمويل", "Financing products") },
  fields: [
    f.name(), f.summary(), f.body("body", L("التفاصيل", "Details")), f.list("requirements", L("المتطلبات", "Requirements")), f.slug("name"),
    { name: "maxAmount", type: "money", label: L("الحد الأقصى للمبلغ", "Maximum amount"), required: true, min: 100000, section: SECTIONS.numbers, width: "half" },
    { name: "maxMonths", type: "number", label: L("أقصى مدة (شهر)", "Maximum term (months)"), required: true, min: 1, max: 360, section: SECTIONS.numbers, width: "half" },
    { name: "annualProfitRate", type: "percent", label: L("نسبة الربح السنوية الاسترشادية", "Indicative annual profit rate"), required: true, min: 0, max: 100, step: 0.25, section: SECTIONS.numbers, width: "half" },
    f.status(ACTIVE), f.position(), f.seo(),
  ],
  columns: [
    { key: "name", label: L("المنتج", "Product"), kind: "title", sortable: true, subKey: "slug" },
    { key: "maxAmount", label: L("الحد الأقصى", "Max amount"), kind: "money", sortable: true, align: "end", hideBelow: "md" },
    { key: "maxMonths", label: L("المدة", "Term"), kind: "number", sortable: true, align: "end", hideBelow: "lg" },
    { key: "annualProfitRate", label: L("الربح %", "Rate %"), kind: "percent", sortable: true, align: "end" },
    commonCols.status,
  ],
  statuses: ACTIVE, searchable: true, defaultSort: "position", bulkActions: ["activate", "deactivate", "delete"], csv: true,
  publicPath: (r) => `/financing/${String(r.slug)}`,
  defaults: () => ({ name: emptyL(), summary: emptyL(), body: emptyL(), requirements: emptyList(), slug: "", maxAmount: 1000000, maxMonths: 36, annualProfitRate: 8, status: "active", position: 0, seo: emptySeo() }),
};

const NETWORKS = [{ value: "Visa", label: L("Visa", "Visa") }, { value: "Mastercard", label: L("Mastercard", "Mastercard") }, { value: "Local", label: L("محلية", "Local") }];
const TONES = [{ value: "jade", label: L("يشمي", "Jade") }, { value: "saffron", label: L("زعفراني", "Saffron") }, { value: "lapis", label: L("لازوردي", "Lapis") }, { value: "graphite", label: L("رمادي", "Graphite") }];

export const cards: ResourceDef = {
  key: "cards", endpoint: "cards", permission: "cards", icon: "card", group: "catalog", labelKey: "name",
  title: { one: L("بطاقة", "Card"), many: L("البطاقات", "Cards") },
  fields: [
    f.name(), f.summary(), f.list("features", L("المزايا", "Features")), { name: "fees", type: "localizedText", label: L("الرسوم", "Fees") }, f.slug("name"),
    { name: "network", type: "select", label: L("الشبكة", "Network"), required: true, options: NETWORKS, section: SECTIONS.general, width: "half" },
    { name: "tone", type: "select", label: L("لون التصميم", "Design tone"), required: true, options: TONES, section: SECTIONS.general, width: "half" },
    f.status(ACTIVE), f.position(),
  ],
  columns: [
    { key: "name", label: L("البطاقة", "Card"), kind: "title", sortable: true, subKey: "slug" },
    { key: "network", label: L("الشبكة", "Network"), kind: "badge", options: NETWORKS },
    { key: "tone", label: L("اللون", "Tone"), kind: "badge", options: TONES, hideBelow: "md" }, commonCols.status, commonCols.updated,
  ],
  filters: [{ key: "network", label: L("الشبكة", "Network"), options: NETWORKS }],
  statuses: ACTIVE, searchable: true, defaultSort: "position", bulkActions: ["activate", "deactivate", "delete"],
  publicPath: (r) => `/cards/${String(r.slug)}`,
  defaults: () => ({ name: emptyL(), summary: emptyL(), features: emptyList(), fees: emptyL(), slug: "", network: "Visa", tone: "jade", status: "active", position: 0 }),
};

export const offers: ResourceDef = {
  key: "offers", endpoint: "offers", permission: "offers", icon: "sparkle", group: "catalog", labelKey: "title",
  title: { one: L("عرض", "Offer"), many: L("العروض", "Offers") },
  fields: [
    f.title(true, 60), { name: "details", type: "localizedTextarea", label: L("التفاصيل", "Details"), required: true, maxChars: 200 }, f.slug(),
    { name: "media", type: "media", label: L("الصورة", "Image"), accept: ["image"], section: SECTIONS.general }, f.href(),
    { name: "startsAt", type: "date", label: L("يبدأ", "Starts"), required: true, section: SECTIONS.schedule, width: "half" },
    { name: "endsAt", type: "date", label: L("ينتهي", "Ends"), required: true, section: SECTIONS.schedule, width: "half" },
    f.status(ACTIVE), f.position(),
  ],
  columns: [
    { key: "media", label: L("صورة", "Image"), kind: "media", hideBelow: "md" },
    { key: "title", label: L("العرض", "Offer"), kind: "title", sortable: true, subKey: "slug" },
    { key: "startsAt", label: L("يبدأ", "Starts"), kind: "date", sortable: true, hideBelow: "lg" },
    { key: "endsAt", label: L("ينتهي", "Ends"), kind: "date", sortable: true }, commonCols.status,
  ],
  statuses: ACTIVE, searchable: true, defaultSort: "-endsAt", bulkActions: ["activate", "deactivate", "delete"], csv: true,
  publicPath: (r) => `/offers/${String(r.slug)}`,
  defaults: () => ({ title: emptyL(), details: emptyL(), slug: "", media: null, href: "", startsAt: null, endsAt: null, status: "active", position: 0 }),
};

import type { ResourceDef } from "./types";
import { ACTIVE, CONTENT, L, SECTIONS, commonCols, emptyL, emptyList, emptySeo, f, statusOptions } from "./shared";

export const pages: ResourceDef = {
  key: "pages", endpoint: "pages", permission: "pages", icon: "page", group: "content", labelKey: "title",
  title: { one: L("صفحة", "Page"), many: L("الصفحات", "Pages") },
  fields: [
    f.title(), f.summary("summary", L("الملخص", "Summary"), false), f.slug(),
    { name: "template", type: "select", label: L("القالب", "Template"), required: true, options: [{ value: "default", label: L("افتراضي", "Default") }, { value: "home", label: L("الرئيسية", "Home") }], section: SECTIONS.general, width: "half" },
    f.status(CONTENT), { name: "publishAt", type: "datetime", label: L("موعد النشر", "Publish at"), section: SECTIONS.display, width: "half" }, f.seo(),
  ],
  columns: [
    { key: "title", label: L("العنوان", "Title"), kind: "title", sortable: true, subKey: "slug" },
    { key: "template", label: L("القالب", "Template"), kind: "badge", options: [{ value: "default", label: L("افتراضي", "Default") }, { value: "home", label: L("الرئيسية", "Home") }], hideBelow: "md" },
    { key: "sections", label: L("الأقسام", "Sections"), kind: "count", hideBelow: "lg" },
    commonCols.status, commonCols.updated,
  ],
  statuses: CONTENT, searchable: true, defaultSort: "-updatedAt", bulkActions: ["publish", "unpublish", "archive", "delete"],
  publicPath: (r) => (r.slug === "home" ? "/" : `/${String(r.slug)}`), aside: ["pageBuilder", "publishInfo"],
  defaults: () => ({ title: emptyL(), summary: emptyL(), slug: "", template: "default", status: "draft", publishAt: null, seo: emptySeo(), sections: [] }),
};

export const news: ResourceDef = {
  key: "news", endpoint: "news", permission: "news", icon: "news", group: "content", labelKey: "title",
  title: { one: L("خبر", "Article"), many: L("الأخبار", "News") },
  fields: [
    f.title(true, 110), f.summary("excerpt", L("المقتطف", "Excerpt")), f.body("content", L("نص الخبر", "Article body")), f.slug(),
    { name: "categoryId", type: "relation", label: L("التصنيف", "Category"), required: true, relation: { endpoint: "news-categories", labelKey: "name" }, section: SECTIONS.general, width: "half" },
    { name: "featuredMedia", type: "media", label: L("الصورة الرئيسية", "Featured image"), accept: ["image"], section: SECTIONS.general },
    f.seo(),
  ],
  columns: [
    { key: "featuredMedia", label: L("صورة", "Image"), kind: "media", hideBelow: "md" },
    { key: "title", label: L("العنوان", "Title"), kind: "title", sortable: true, subKey: "slug" },
    { key: "categoryId", label: L("التصنيف", "Category"), kind: "relation", relation: { endpoint: "news-categories", labelKey: "name" }, hideBelow: "lg" },
    { key: "author", label: L("الكاتب", "Author"), kind: "text", hideBelow: "xl" },
    commonCols.status,
    { key: "publishedAt", label: L("تاريخ النشر", "Published"), kind: "date", sortable: true, hideBelow: "md" },
  ],
  filters: [{ key: "categoryId", label: L("التصنيف", "Category"), relation: { endpoint: "news-categories", labelKey: "name" } }],
  statuses: CONTENT, searchable: true, defaultSort: "-updatedAt", bulkActions: ["archive", "delete"], csv: true,
  publicPath: (r) => `/news/${String(r.slug)}`, aside: ["newsWorkflow"],
  defaults: () => ({ title: emptyL(), excerpt: emptyL(), content: emptyL(), slug: "", categoryId: null, featuredMedia: null, seo: emptySeo() }),
};

export const newsCategories: ResourceDef = {
  key: "news-categories", endpoint: "news-categories", permission: "news-categories", icon: "tag", group: "content", labelKey: "name",
  title: { one: L("تصنيف", "Category"), many: L("تصنيفات الأخبار", "News categories") },
  fields: [f.name(), f.slug("name"), f.position()],
  columns: [{ key: "name", label: L("الاسم", "Name"), kind: "title", sortable: true, subKey: "slug" }, commonCols.position, commonCols.updated],
  searchable: true, defaultSort: "position", bulkActions: ["delete"],
  defaults: () => ({ name: emptyL(), slug: "", position: 0 }),
};

export const banners: ResourceDef = {
  key: "banners", endpoint: "banners", permission: "banners", icon: "banner", group: "content", labelKey: "title",
  title: { one: L("بانر", "Banner"), many: L("البانرات", "Banners") },
  fields: [
    f.title(true, 60), { name: "subtitle", type: "localizedText", label: L("العنوان الفرعي", "Subtitle") },
    { name: "ctaLabel", type: "localizedText", label: L("نص الزر", "Button label") },
    { name: "media", type: "media", label: L("الصورة", "Image"), required: true, accept: ["image"], section: SECTIONS.general },
    { name: "ctaHref", type: "text", label: L("رابط الزر", "Button link"), placeholder: "/offers", section: SECTIONS.general, width: "half" },
    { name: "placement", type: "select", label: L("الموضع", "Placement"), required: true, section: SECTIONS.general, width: "half", options: [
      { value: "home_hero", label: L("واجهة الرئيسية", "Home hero") }, { value: "home_strip", label: L("شريط الرئيسية", "Home strip") }, { value: "financing_page", label: L("صفحة التمويل", "Financing page") }] },
    { name: "startsAt", type: "date", label: L("يبدأ", "Starts"), section: SECTIONS.schedule, width: "half" },
    { name: "endsAt", type: "date", label: L("ينتهي", "Ends"), section: SECTIONS.schedule, width: "half" },
    f.status(ACTIVE), f.position(),
  ],
  columns: [
    { key: "media", label: L("صورة", "Image"), kind: "media" },
    { key: "title", label: L("العنوان", "Title"), kind: "title", sortable: true },
    { key: "placement", label: L("الموضع", "Placement"), kind: "badge", hideBelow: "md", options: [{ value: "home_hero", label: L("واجهة الرئيسية", "Home hero") }, { value: "home_strip", label: L("شريط الرئيسية", "Home strip") }, { value: "financing_page", label: L("صفحة التمويل", "Financing page") }] },
    { key: "endsAt", label: L("ينتهي", "Ends"), kind: "date", sortable: true, hideBelow: "lg" }, commonCols.status,
  ],
  statuses: ACTIVE, searchable: true, defaultSort: "position", bulkActions: ["activate", "deactivate", "delete"],
  defaults: () => ({ title: emptyL(), subtitle: emptyL(), ctaLabel: emptyL(), media: null, ctaHref: "", placement: "home_strip", startsAt: null, endsAt: null, status: "active", position: 0 }),
};

export const faqs: ResourceDef = {
  key: "faqs", endpoint: "faqs", permission: "faqs", icon: "help", group: "content", labelKey: "question",
  title: { one: L("سؤال", "Question"), many: L("الأسئلة الشائعة", "FAQs") },
  fields: [
    { name: "question", type: "localizedText", label: L("السؤال", "Question"), required: true },
    { name: "answer", type: "localizedRichText", label: L("الإجابة", "Answer"), required: true },
    { name: "categoryId", type: "relation", label: L("التصنيف", "Category"), required: true, relation: { endpoint: "faq-categories", labelKey: "name" }, section: SECTIONS.general, width: "half" },
    { name: "isFeatured", type: "boolean", label: L("يظهر في الرئيسية", "Featured on home page"), section: SECTIONS.display },
    f.status(ACTIVE), f.position(),
  ],
  columns: [
    { key: "question", label: L("السؤال", "Question"), kind: "title", sortable: true },
    { key: "categoryId", label: L("التصنيف", "Category"), kind: "relation", relation: { endpoint: "faq-categories", labelKey: "name" }, hideBelow: "md" },
    { key: "isFeatured", label: L("في الرئيسية", "Featured"), kind: "boolean", hideBelow: "lg" }, commonCols.position, commonCols.status,
  ],
  filters: [{ key: "categoryId", label: L("التصنيف", "Category"), relation: { endpoint: "faq-categories", labelKey: "name" } }],
  statuses: ACTIVE, searchable: true, defaultSort: "position", bulkActions: ["activate", "deactivate", "delete"],
  defaults: () => ({ question: emptyL(), answer: emptyL(), categoryId: null, isFeatured: false, status: "active", position: 0 }),
};

export const faqCategories: ResourceDef = {
  key: "faq-categories", endpoint: "faq-categories", permission: "faqs", icon: "tag", group: "content", labelKey: "name",
  title: { one: L("تصنيف", "Category"), many: L("تصنيفات الأسئلة", "FAQ categories") },
  fields: [f.name(), f.slug("name"), f.position()],
  columns: [{ key: "name", label: L("الاسم", "Name"), kind: "title", sortable: true, subKey: "slug" }, commonCols.position, commonCols.updated],
  searchable: true, defaultSort: "position", bulkActions: ["delete"],
  defaults: () => ({ name: emptyL(), slug: "", position: 0 }),
};

export const menus: ResourceDef = {
  key: "menus", endpoint: "menus", permission: "menus", icon: "list", group: "content", labelKey: "name",
  title: { one: L("قائمة", "Menu"), many: L("القوائم", "Menus") },
  fields: [
    { name: "name", type: "text", label: L("اسم القائمة", "Menu name"), required: true, section: SECTIONS.general, width: "half", tab: "settings" },
    { name: "location", type: "select", label: L("الموضع", "Location"), required: true, section: SECTIONS.general, width: "half", tab: "settings", options: [{ value: "header", label: L("الترويسة", "Header") }, { value: "footer", label: L("التذييل", "Footer") }] },
    { name: "items", type: "menuTree", label: L("عناصر القائمة", "Menu items"), tab: "settings" },
  ],
  columns: [
    { key: "name", label: L("القائمة", "Menu"), kind: "title", sortable: true },
    { key: "location", label: L("الموضع", "Location"), kind: "badge", options: [{ value: "header", label: L("الترويسة", "Header") }, { value: "footer", label: L("التذييل", "Footer") }] },
    { key: "items", label: L("العناصر", "Items"), kind: "count" }, commonCols.updated,
  ],
  defaultSort: "name", noDelete: false,
  defaults: () => ({ name: "", location: "header", items: [] }),
};

export { emptyList };

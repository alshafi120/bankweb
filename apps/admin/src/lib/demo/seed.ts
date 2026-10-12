/**
 * Deterministic fictional seed data for demo mode. No real people, no real customer data.
 * Content reuses apps/web demo home content (copied in ./home-content.ts) so CMS and site tell the same story.
 */
import type {
  BlockDataMap, IconName, AdminSession, ApplicationStatus, AuditLogEntry, ContentStatus, HomeSectionType, Localized, MediaItem, MediaRef, MenuItem, Role, Seo,
} from "@/types/api";
import type { AdminMenu, AdminNews, AdminPage, AdminPageSection, AdminRole, AdminSettings, AdminUserRecord, AnyRecord, InboxRecord } from "@/types/admin";
import { ROLES, ROLE_PERMISSIONS, permissionsFor } from "@/lib/rbac";
import { demoHome } from "./home-content";
import { coverArt, fileTile, portraitArt } from "./media-art";

export const DEMO_EMAIL = "admin@withaq.example";
export const DEMO_PASSWORD = "Demo@Withaq2026!";
export const DEMO_2FA = "123456";
export const DEMO_RECOVERY = ["WTQ7-K2M9-4XPA", "WTQ7-R8D3-NC6L", "WTQ7-Q5H2-ZB1T", "WTQ7-M4V8-JE9S"];

export interface DemoDb {
  version: number;
  seq: number;
  collections: Record<string, AnyRecord[]>;
  settings: AdminSettings;
  sessions: AdminSession[];
  auth: { userId: number | null; pending2fa: number | null; failed: Record<string, number>; lockedUntil: Record<string, number>; twoFactorSecret: string | null };
  notificationsReadAt: string;
}

/* ───── deterministic helpers ───── */
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261006);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]!;
const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const L = (ar: string, en: string): Localized => ({ ar, en });
const DAY = 86_400_000;
const iso = (t: number) => new Date(t).toISOString();
const dateOnly = (t: number) => new Date(t).toISOString().slice(0, 10);
const html = (ar: string, en: string): Localized => ({ ar: `<p>${ar}</p>`, en: `<p>${en}</p>` });

export const CITIES: { id: number; name: Localized }[] = [
  { id: 1, name: L("صنعاء", "Sana'a") }, { id: 2, name: L("عدن", "Aden") }, { id: 3, name: L("تعز", "Taiz") }, { id: 4, name: L("المكلا", "Mukalla") },
  { id: 5, name: L("مأرب", "Marib") }, { id: 6, name: L("الحديدة", "Hodeidah") }, { id: 7, name: L("إب", "Ibb") }, { id: 8, name: L("سيئون", "Seiyun") },
  { id: 9, name: L("ذمار", "Dhamar") }, { id: 10, name: L("حجة", "Hajjah") },
];
const cityIdOf = (en: string) => CITIES.find((c) => c.name.en === en)?.id ?? 1;

const emptySeo = (title: Localized, description: Localized = L("", "")): Seo => ({
  title, description, keywords: L("", ""), canonical: null, ogImage: null, noindex: false,
});

export function seed(now = Date.now()): DemoDb {
  let id = 1000;
  const nextId = () => ++id;
  const stamp = (daysAgo: number) => ({ createdAt: iso(now - daysAgo * DAY), updatedAt: iso(now - Math.max(0, daysAgo - int(0, 3)) * DAY) });

  /* ───── users (one per role) ───── */
  const people: [string, string, Role][] = [
    ["Ahlam Al-Sharabi", "a.sharabi", "super_admin"], ["Yousef Al-Haddad", "y.haddad", "content_manager"], ["Mona Bawazir", "m.bawazir", "news_manager"],
    ["Khaled Al-Absi", "k.absi", "marketing_manager"], ["Rania Al-Qadhi", "r.qadhi", "hr_manager"], ["Fahd Ba-Shammakh", "f.bashammakh", "branch_manager"],
    ["Sami Al-Wazir", "s.wazir", "customer_service"], ["Huda Al-Maqtari", "h.maqtari", "reviewer"], ["Omar Al-Hakimi", "o.hakimi", "viewer"],
    ["Nada Al-Saqqaf", "n.saqqaf", "customer_service"], ["Tariq Al-Ansi", "t.ansi", "news_manager"],
  ];
  const users: AdminUserRecord[] = [
    {
      id: 1, name: "مسؤول النظام التجريبي", email: DEMO_EMAIL, username: "admin", roles: ["super_admin"], permissions: permissionsFor(["super_admin"]),
      twoFactorEnabled: true, isActive: true, lastLoginAt: iso(now - 2 * DAY), createdAt: iso(now - 400 * DAY), lockedUntil: null, failedLoginAttempts: 0,
    },
    ...people.map(([name, username, role], i): AdminUserRecord => ({
      id: i + 2, name, email: `${username}@withaq.example`, username, roles: [role], permissions: permissionsFor([role]),
      twoFactorEnabled: i % 3 !== 2, isActive: i !== 8, lastLoginAt: i === 10 ? null : iso(now - int(0, 20) * DAY - int(0, 80000) * 1000),
      createdAt: iso(now - int(60, 380) * DAY), lockedUntil: i === 5 ? iso(now + 12 * 60_000) : null, failedLoginAttempts: i === 5 ? 5 : 0,
    })),
  ];
  const author = (uid: number) => { const u = users.find((x) => x.id === uid)!; return { id: u.id, name: u.name }; };

  /* ───── roles ───── */
  const roleLabels: Record<Role, Localized> = {
    super_admin: L("مدير النظام", "Super admin"), content_manager: L("مدير المحتوى", "Content manager"), news_manager: L("مدير الأخبار", "News manager"),
    marketing_manager: L("مدير التسويق", "Marketing manager"), hr_manager: L("مدير الموارد البشرية", "HR manager"), branch_manager: L("مدير الفروع", "Branch manager"),
    customer_service: L("خدمة العملاء", "Customer service"), reviewer: L("مراجع", "Reviewer"), viewer: L("مشاهد", "Viewer"),
  };
  const roles: AdminRole[] = ROLES.map((r, i) => ({
    id: i + 1, name: r, label: roleLabels[r], description: null, permissions: [...ROLE_PERMISSIONS[r]], usersCount: users.filter((u) => u.roles.includes(r)).length,
  }));

  /* ───── media ───── */
  const media: MediaItem[] = [];
  const imgNames = [
    ["solar-irrigation.jpg", "منظومة ري بالطاقة الشمسية", "Solar irrigation system"], ["mobile-app-v4.jpg", "واجهة التطبيق الجديدة", "New app interface"],
    ["seiyun-branch.jpg", "فرع سيئون", "Seiyun branch"], ["literacy-week.jpg", "أسبوع الثقافة المالية", "Financial literacy week"],
    ["back-to-school.jpg", "عرض العودة للمدارس", "Back to school offer"], ["cashback.jpg", "عرض الاسترداد النقدي", "Cashback offer"],
    ["new-account.jpg", "حساب جديد وبطاقة مجانية", "New account, free card"], ["hero-home.jpg", "واجهة الصفحة الرئيسية", "Home hero"],
    ["hq-building.jpg", "المبنى الرئيسي للبنك", "Bank headquarters"], ["sme-workshop.jpg", "ورشة المشاريع الصغيرة", "SME workshop"],
    ["atm-network.jpg", "شبكة الصرافات الآلية", "ATM network"], ["qr-payments.jpg", "الدفع بالـ QR", "QR payments"],
    ["women-finance.jpg", "تمويل رائدات الأعمال", "Women entrepreneurs financing"], ["agri-season.jpg", "موسم الحصاد", "Harvest season"],
  ];
  imgNames.forEach(([file, ar, en], i) => media.push({
    id: i + 1, url: coverArt(i, 1200, 800), filename: file!, mime: "image/jpeg", kind: "image", size: int(180, 980) * 1024, width: 1200, height: 800,
    alt: L(ar!, en!), uploader: author(pick([1, 2, 3, 5])), createdAt: iso(now - (60 - i * 3) * DAY),
  }));
  const portraits = [["board-chair.jpg", "AS"], ["board-vice.jpg", "MB"], ["ceo.jpg", "KH"], ["cfo.jpg", "RQ"]] as const;
  portraits.forEach(([file, ini], i) => media.push({
    id: 20 + i, url: portraitArt(i + 1, ini), filename: file, mime: "image/jpeg", kind: "image", size: int(60, 140) * 1024, width: 400, height: 400,
    alt: L("صورة شخصية", "Portrait"), uploader: author(2), createdAt: iso(now - 90 * DAY),
  }));
  const docs = [
    ["annual-report-2025.pdf", "pdf", "التقرير السنوي 2025", "Annual report 2025"], ["governance-charter.pdf", "pdf", "ميثاق الحوكمة", "Governance charter"],
    ["financial-statements-2025.pdf", "pdf", "القوائم المالية 2025", "Financial statements 2025"], ["fees-schedule.docx", "document", "جدول الرسوم", "Fees schedule"],
    ["app-tour.mp4", "video", "جولة في التطبيق", "App tour"],
  ] as const;
  docs.forEach(([file, kind, ar, en], i) => media.push({
    id: 30 + i, url: fileTile(kind, file), filename: file, kind,
    mime: kind === "pdf" ? "application/pdf" : kind === "video" ? "video/mp4" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: int(400, 4800) * 1024, width: null, height: null, alt: L(ar, en), uploader: author(2), createdAt: iso(now - (40 - i * 5) * DAY),
  }));
  const ref = (mid: number): MediaRef => { const m = media.find((x) => x.id === mid)!; return { id: m.id, url: m.url, alt: m.alt, mime: m.mime, width: m.width, height: m.height }; };

  /* ───── catalog from the public site demo ───── */
  const services = demoHome.services.map((s, i) => ({
    id: i + 1, slug: s.href.replace(/^\//, "").replace(/[#/]/g, "-") || `service-${i + 1}`, icon: s.icon, title: s.title, summary: s.summary,
    body: html(s.summary.ar, s.summary.en), href: s.href, position: i + 1, status: i === 5 ? "inactive" : "active", seo: emptySeo(s.title, s.summary), ...stamp(120 - i),
  }));
  const accountTypes = ["current", "savings", "investment", "business"] as const;
  const products = demoHome.accounts.map((a, i) => ({
    id: i + 1, slug: accountTypes[i]!, accountType: accountTypes[i]!, name: a.name, tagline: a.tagline, features: a.features, requirements: a.requirements,
    minimumBalance: a.minimumBalance, currency: "YER", href: a.href, position: i + 1, status: "active", seo: emptySeo(a.name, a.tagline), ...stamp(200 - i),
  }));
  const finSlugs = ["personal", "sme", "commercial", "corporate", "agricultural", "women"];
  const financing = demoHome.financing.map((f, i) => ({
    id: i + 1, slug: finSlugs[i]!, name: f.name, summary: f.summary, body: html(f.summary.ar, f.summary.en), maxAmount: f.maxAmount, maxMonths: f.maxMonths,
    annualProfitRate: f.annualProfitRate, requirements: { ar: ["بطاقة شخصية سارية", "إثبات دخل"], en: ["Valid national ID", "Proof of income"] },
    position: i + 1, status: "active", seo: emptySeo(f.name, f.summary), ...stamp(150 - i),
  }));
  const cardSlugs = ["debit", "prepaid", "credit", "business"];
  const cards = demoHome.cards.map((c, i) => ({
    id: i + 1, slug: cardSlugs[i]!, name: c.name, summary: c.summary, network: c.network, tone: c.tone,
    features: { ar: ["سحب من الصرافات", "شراء عبر الإنترنت"], en: ["ATM withdrawals", "Online purchases"] }, fees: L("رسوم الإصدار 2,000 ر.ي", "Issuance fee YER 2,000"),
    position: i + 1, status: i === 3 ? "inactive" : "active", ...stamp(100 - i),
  }));
  const offers = demoHome.offers.map((o, i) => ({
    id: i + 1, slug: o.href.split("/").pop()!, title: o.title, details: o.details, media: ref(5 + i), href: o.href,
    startsAt: o.startsAt, endsAt: o.endsAt, position: i + 1, status: "active", ...stamp(30 - i * 5),
  }));
  const banners = [
    { title: L("حسابك في دقائق", "Your account in minutes"), subtitle: L("افتح حسابك من الجوال", "Open it from your phone"), placement: "home_hero", mediaId: 8 },
    { title: L("استرداد نقدي 5%", "5% cashback"), subtitle: L("على مشتريات بطاقة الخصم", "On debit card purchases"), placement: "home_strip", mediaId: 6 },
    { title: L("التمويل الزراعي", "Agricultural financing"), subtitle: L("موسم الحصاد يبدأ هنا", "Harvest season starts here"), placement: "financing_page", mediaId: 14 },
  ].map((b, i) => ({
    id: i + 1, title: b.title, subtitle: b.subtitle, media: ref(b.mediaId), ctaLabel: L("اعرف المزيد", "Learn more"), ctaHref: "/offers", placement: b.placement,
    startsAt: dateOnly(now - 10 * DAY), endsAt: dateOnly(now + 50 * DAY), position: i + 1, status: i === 2 ? "inactive" : "active", ...stamp(20 - i),
  }));
  const faqCats = [L("الحسابات", "Accounts"), L("التمويل", "Financing"), L("البطاقات", "Cards"), L("الخدمات الرقمية", "Digital")].map((n, i) => ({
    id: i + 1, slug: ["accounts", "financing", "cards", "digital"][i]!, name: n, position: i + 1, ...stamp(300),
  }));
  const faqs = demoHome.faqs.map((q, i) => ({
    id: i + 1, categoryId: [1, 2, 3, 1, 4, 4][i]!, question: q.question, answer: html(q.answer.ar, q.answer.en), isFeatured: i < 5,
    position: i + 1, status: "active", ...stamp(90 - i),
  }));

  /* ───── network ───── */
  const locs = demoHome.locations;
  const mkLoc = (l: (typeof locs)[number], i: number, extra: Record<string, unknown>) => ({
    id: i + 1, slug: l.name.en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), type: l.type, cityId: cityIdOf(l.city.en),
    name: l.name, district: l.district, address: l.address, phone: l.phone, hours: l.hours, services: l.services, lat: l.lat, lng: l.lng,
    status: "active", position: i + 1, ...extra, ...stamp(250 - i),
  });
  const branchSeeds = [...locs.filter((l) => l.type === "branch"),
    { ...locs[0]!, id: "x1", name: L("فرع سيئون", "Seiyun Branch"), city: L("سيئون", "Seiyun"), district: L("الوسط", "Downtown"), lat: 15.943, lng: 48.789, phone: "+967 5 400 409" },
    { ...locs[0]!, id: "x2", name: L("فرع ذمار", "Dhamar Branch"), city: L("ذمار", "Dhamar"), district: L("المدينة", "City"), lat: 14.542, lng: 44.405, phone: "+967 6 400 410" },
  ];
  const branches = branchSeeds.map((l, i) => mkLoc(l, i, { type: "branch", managerName: pick(["أ. فيصل", "أ. سلوى", "أ. ماجد", "أ. نوال"]), status: i === 6 ? "inactive" : "active" }));
  const atmSeeds = [...locs.filter((l) => l.type === "atm"),
    { ...locs[5]!, name: L("صراف عدن – المعلا", "Aden ATM – Mualla"), city: L("عدن", "Aden"), district: L("المعلا", "Mualla"), lat: 12.792, lng: 44.989 },
    { ...locs[5]!, name: L("صراف تعز – الحوبان", "Taiz ATM – Hawban"), city: L("تعز", "Taiz"), district: L("الحوبان", "Hawban"), lat: 13.61, lng: 44.08 },
  ];
  const atms = atmSeeds.map((l, i) => mkLoc(l, i, { type: "atm", is24h: i !== 2, supportsDeposit: i % 2 === 1 }));
  const agentSeeds = [...locs.filter((l) => l.type === "agent"),
    { ...locs[6]!, name: L("وكيل إب – السوق", "Ibb Agent – Market"), city: L("إب", "Ibb"), district: L("السوق", "Market"), lat: 13.97, lng: 44.18 },
    { ...locs[6]!, name: L("وكيل حجة – الوسط", "Hajjah Agent – Center"), city: L("حجة", "Hajjah"), district: L("الوسط", "Center"), lat: 15.69, lng: 43.6 },
  ];
  const agents = agentSeeds.map((l, i) => mkLoc(l, i, { type: "agent", agentCode: `AG-${String(1040 + i * 7)}` }));

  /* ───── jobs ───── */
  const jobs = [
    [L("محلل ائتمان", "Credit analyst"), L("إدارة الائتمان", "Credit"), 1, "full_time"], [L("مطوّر تطبيقات جوال", "Mobile developer"), L("التحول الرقمي", "Digital"), 1, "full_time"],
    [L("موظف خدمة عملاء", "Customer service officer"), L("الفروع", "Branches"), 2, "full_time"], [L("مدقق داخلي", "Internal auditor"), L("التدقيق الداخلي", "Internal audit"), 1, "contract"],
    [L("متدرب علاقات عملاء", "Relationship intern"), L("الأفراد", "Retail"), 3, "internship"], [L("أخصائي أمن معلومات", "Information security specialist"), L("تقنية المعلومات", "IT"), 1, "full_time"],
  ].map(([title, dept, city, type], i) => ({
    id: i + 1, slug: (title as Localized).en.toLowerCase().replace(/[^a-z0-9]+/g, "-"), title, department: dept, cityId: city, employmentType: type,
    summary: L("انضم إلى فريق يبني مستقبل الصيرفة في اليمن.", "Join a team building the future of banking in Yemen."),
    description: html("نبحث عن شخص شغوف يملك خبرة مناسبة ورغبة في التعلم.", "We're looking for a passionate person with relevant experience and a will to learn."),
    requirements: { ar: ["مؤهل جامعي", "إجادة العربية والإنجليزية"], en: ["University degree", "Arabic and English"] },
    closesAt: dateOnly(now + (i === 4 ? -3 : 10 + i * 6) * DAY), status: i === 4 ? "closed" : i === 5 ? "inactive" : "active", ...stamp(40 - i * 4),
  }));

  /* ───── news ───── */
  const newsCats = [L("التمويل", "Financing"), L("الخدمات الرقمية", "Digital"), L("الانتشار", "Network"), L("المسؤولية المجتمعية", "CSR"), L("أخبار البنك", "Bank news")].map((n, i) => ({
    id: i + 1, slug: ["financing", "digital", "network", "csr", "bank"][i]!, name: n, position: i + 1, ...stamp(300),
  }));
  const newsSeeds: { title: Localized; excerpt: Localized; cat: number; status: ContentStatus; daysAgo: number; author: number; mediaId: number | null }[] = [
    ...demoHome.news.map((n, i) => ({ title: n.title, excerpt: n.excerpt, cat: [1, 2, 3, 4][i]!, status: "published" as const, daysAgo: [8, 21, 37, 55][i]!, author: [3, 12, 3, 4][i]!, mediaId: i + 1 })),
    { title: L("البنك يحصل على شهادة PCI DSS لأمن البطاقات", "Bank achieves PCI DSS certification for card security"), excerpt: L("خطوة جديدة في حماية بيانات حاملي البطاقات.", "A new step in protecting cardholder data."), cat: 5, status: "pending_review", daysAgo: 1, author: 3, mediaId: 11 },
    { title: L("ورشة لرواد الأعمال في عدن حول التمويل الأصغر", "Aden workshop on microfinance for entrepreneurs"), excerpt: L("أكثر من 80 مشاركاً من أصحاب المشاريع الصغيرة.", "More than 80 small-business owners took part."), cat: 4, status: "pending_review", daysAgo: 2, author: 1, mediaId: 10 },
    { title: L("تحديث ساعات العمل خلال شهر رمضان", "Updated opening hours during Ramadan"), excerpt: L("تعرّف على مواعيد الفروع والصرافات.", "Branch and ATM hours for the holy month."), cat: 3, status: "draft", daysAgo: 0, author: 1, mediaId: null },
    { title: L("إطلاق خدمة الدفع بالـ QR لدى 2,000 تاجر", "QR payments go live at 2,000 merchants"), excerpt: L("ادفع بمسح الرمز من التطبيق.", "Pay by scanning the code in the app."), cat: 2, status: "approved", daysAgo: 3, author: 12, mediaId: 12 },
    { title: L("نتائج الربع الثالث 2026", "Q3 2026 results"), excerpt: L("نمو في الودائع وقاعدة العملاء.", "Growth in deposits and customer base."), cat: 5, status: "scheduled", daysAgo: 1, author: 3, mediaId: 9 },
    { title: L("برنامج تمويل رائدات الأعمال يصل إلى تعز", "Women entrepreneurs programme reaches Taiz"), excerpt: L("تمويل ميسّر وتدريب مجاني.", "Preferential financing and free training."), cat: 1, status: "draft", daysAgo: 4, author: 5, mediaId: 13 },
    { title: L("أرشيف: افتتاح فرع المكلا الجديد", "Archive: new Mukalla branch opening"), excerpt: L("خبر مؤرشف من العام الماضي.", "Archived story from last year."), cat: 3, status: "archived", daysAgo: 300, author: 3, mediaId: 3 },
  ];
  const news: AdminNews[] = newsSeeds.map((n, i) => {
    const created = now - (n.daysAgo + 2) * DAY;
    const reviewed = ["approved", "published", "scheduled", "archived"].includes(n.status);
    return {
      id: i + 1, slug: n.title.en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60), categoryId: n.cat, title: n.title, excerpt: n.excerpt,
      content: { ar: `<p>${n.excerpt.ar}</p><h2>التفاصيل</h2><p>أعلن بنك وِثاق اليوم عن ${n.title.ar}، في إطار خطته لتوسيع خدماته وتعزيز الشمول المالي.</p><ul><li>متاح في جميع الفروع</li><li>تفاصيل إضافية على الموقع</li></ul>`,
        en: `<p>${n.excerpt.en}</p><h2>Details</h2><p>Withaq Bank today announced: ${n.title.en}, as part of its plan to expand services and financial inclusion.</p><ul><li>Available at every branch</li><li>More details on the website</li></ul>` },
      featuredMedia: n.mediaId ? ref(n.mediaId) : null, author: author(n.author), status: n.status,
      publishAt: n.status === "scheduled" ? iso(now + 2 * DAY) : null, publishedAt: n.status === "published" || n.status === "archived" ? iso(now - n.daysAgo * DAY) : null,
      reviewedBy: reviewed ? author(9) : null, reviewedAt: reviewed ? iso(created + DAY) : null, reviewNote: null,
      seo: emptySeo(n.title, n.excerpt), createdAt: iso(created), updatedAt: iso(now - n.daysAgo * DAY),
    };
  });
  news[6]!.reviewNote = null;
  news[9]!.reviewNote = "يرجى إضافة اقتباس من مدير البرنامج وتوضيح المدن المشمولة.";

  /* ───── pages ───── */
  let sid = 1;
  const sec = (type: AdminPageSection["type"], data: AdminPageSection["data"], extra: Partial<AdminPageSection> = {}): AdminPageSection =>
    ({ id: sid++, type, data, isVisible: true, startsAt: null, endsAt: null, ...extra });
  const homeOrder: HomeSectionType[] = ["hero", "services", "needs", "accounts", "financing", "digital", "cards", "network", "news", "offers", "why", "app", "faq", "cta"];
  const pageSeeds: { slug: string; title: Localized; summary: Localized; template: "home" | "default"; status: ContentStatus; sections: AdminPageSection[] }[] = [
    { slug: "home", title: L("الرئيسية", "Home"), summary: L("الصفحة الرئيسية للموقع", "Website home page"), template: "home", status: "published",
      sections: homeOrder.map((t) => sec(`home:${t}`, {}, t === "offers" ? { startsAt: iso(now - 5 * DAY), endsAt: iso(now + 40 * DAY) } : t === "app" ? { isVisible: false } : {})) },
    { slug: "about", title: L("عن البنك", "About us"), summary: L("قصة بنك وِثاق ورؤيته", "Withaq Bank's story and vision"), template: "default", status: "published",
      sections: [
        sec("hero", { title: L("بنك يمني بثقة متجذرة", "A Yemeni bank built on trust"), subtitle: L("نخدم الأفراد والشركات منذ 2009 بأمان وشفافية.", "Serving individuals and businesses since 2009 with security and transparency."), image: ref(9), primary: { label: L("تواصل معنا", "Contact us"), href: "/contact" }, secondary: null }),
        sec("text", { heading: L("رؤيتنا", "Our vision"), body: html("أن نكون البنك الأقرب إلى كل يمني، رقمياً وميدانياً.", "To be the closest bank to every Yemeni — digitally and on the ground.") }),
        sec("statistics", { heading: L("بالأرقام", "In numbers"), items: demoHome.stats.map((s) => ({ value: s.value, suffix: "suffix" in s ? s.suffix : undefined, label: s.label })) }),
        sec("features", { heading: L("قيمنا", "Our values"), body: null, items: demoHome.reasons.slice(0, 3).map((r) => ({ icon: r.icon as IconName, title: r.title, body: r.summary })) } satisfies BlockDataMap["features"]),
        sec("cta", { title: L("انضم إلى أكثر من 420 ألف عميل", "Join more than 420K customers"), body: L("افتح حسابك اليوم.", "Open your account today."), primary: { label: L("افتح حساباً", "Open an account"), href: "/apply/account" }, secondary: null }),
      ] },
    { slug: "board", title: L("مجلس الإدارة", "Board of directors"), summary: L("أعضاء مجلس الإدارة", "Board members"), template: "default", status: "published",
      sections: [sec("people", { heading: L("مجلس الإدارة", "Board of directors"), items: [
        { name: L("أ. عبدالله السقاف", "Abdullah Al-Saqqaf"), role: L("رئيس مجلس الإدارة", "Chairman"), bio: null, photo: ref(20) },
        { name: L("أ. مريم باوزير", "Maryam Bawazir"), role: L("نائب الرئيس", "Vice chair"), bio: null, photo: ref(21) },
        { name: L("د. خالد الحكيمي", "Dr. Khaled Al-Hakimi"), role: L("الرئيس التنفيذي", "Chief executive"), bio: null, photo: ref(22) },
      ] })] },
    { slug: "reports", title: L("التقارير", "Reports"), summary: L("التقارير السنوية والقوائم المالية", "Annual reports and financial statements"), template: "default", status: "published",
      sections: [sec("documents", { heading: L("التقارير المالية", "Financial reports"), items: [
        { title: L("التقرير السنوي 2025", "Annual report 2025"), year: 2025, file: ref(30) }, { title: L("القوائم المالية 2025", "Financial statements 2025"), year: 2025, file: ref(32) },
      ] })] },
    { slug: "governance", title: L("الحوكمة", "Governance"), summary: L("إطار الحوكمة والسياسات", "Governance framework and policies"), template: "default", status: "pending_review",
      sections: [sec("text", { heading: L("إطار الحوكمة", "Governance framework"), body: html("يلتزم البنك بأفضل ممارسات الحوكمة.", "The bank follows governance best practice.") }), sec("documents", { heading: null, items: [{ title: L("ميثاق الحوكمة", "Governance charter"), year: 2026, file: ref(31) }] })] },
    { slug: "csr", title: L("المسؤولية المجتمعية", "Social responsibility"), summary: L("مبادراتنا المجتمعية", "Our community initiatives"), template: "default", status: "draft",
      sections: [sec("gallery", { heading: L("من مبادراتنا", "Our initiatives"), images: [ref(4), ref(10), ref(13), ref(14)] }), sec("video", { heading: L("جولة في التطبيق", "App tour"), url: "https://media.example.ye/app-tour.mp4", poster: ref(2) })] },
    { slug: "privacy", title: L("سياسة الخصوصية", "Privacy policy"), summary: L("كيف نحمي بياناتك", "How we protect your data"), template: "default", status: "published",
      sections: [sec("text", { heading: null, body: html("نجمع الحد الأدنى من البيانات اللازمة لخدمتك ولا نبيعها لأي طرف.", "We collect the minimum data needed to serve you and never sell it.") })] },
    { slug: "terms", title: L("الشروط والأحكام", "Terms & conditions"), summary: L("شروط استخدام الموقع", "Website terms of use"), template: "default", status: "scheduled",
      sections: [sec("text", { heading: null, body: html("باستخدامك للموقع فإنك توافق على هذه الشروط.", "By using this website you agree to these terms.") }), sec("map", { heading: L("فروعنا", "Our branches"), type: "branch", city: null })] },
  ];
  const pages: AdminPage[] = pageSeeds.map((p, i) => ({
    id: i + 1, slug: p.slug, title: p.title, summary: p.summary, template: p.template, status: p.status, sections: p.sections,
    publishAt: p.status === "scheduled" ? iso(now + 3 * DAY) : null, publishedAt: p.status === "published" ? iso(now - (i + 2) * DAY) : null,
    seo: emptySeo(L(`${p.title.ar} | بنك وِثاق`, `${p.title.en} | Withaq Bank`), p.summary), ...stamp(200 - i * 10),
  }));

  /* ───── menus ───── */
  let mid = 1;
  const mi = (ar: string, en: string, href: string, children?: MenuItem[]): MenuItem => ({ id: mid++, label: L(ar, en), href, ...(children ? { children } : {}) });
  const menus: AdminMenu[] = [
    { id: 1, location: "header", name: "Header", updatedAt: iso(now - 6 * DAY), items: [
      mi("الرئيسية", "Home", "/"), mi("عن البنك", "About", "/about", [mi("مجلس الإدارة", "Board", "/board"), mi("الحوكمة", "Governance", "/governance"), mi("التقارير", "Reports", "/reports")]),
      mi("الأفراد", "Personal", "/personal", [mi("الحسابات", "Accounts", "/accounts"), mi("البطاقات", "Cards", "/cards")]), mi("الشركات", "Business", "/business"),
      mi("التمويل", "Financing", "/financing"), mi("الخدمات الرقمية", "Digital", "/digital"), mi("الفروع", "Branches", "/branches"), mi("الأخبار", "News", "/news"), mi("تواصل معنا", "Contact", "/contact"),
    ] },
    { id: 2, location: "footer", name: "Footer", updatedAt: iso(now - 30 * DAY), items: [
      mi("روابط سريعة", "Quick links", "#", [mi("فتح حساب", "Open an account", "/apply/account"), mi("طلب تمويل", "Apply for financing", "/apply/financing"), mi("الوظائف", "Careers", "/careers")]),
      mi("الدعم", "Support", "#", [mi("الأسئلة الشائعة", "FAQ", "/faq"), mi("الشكاوى", "Complaints", "/complaints"), mi("الخصوصية", "Privacy", "/privacy"), mi("الشروط", "Terms", "/terms")]),
    ] },
  ];

  /* ───── requests (≈60 applications + contact/complaints/jobs over 30 days) ───── */
  const first = ["محمد", "أحمد", "فاطمة", "عائشة", "علي", "خديجة", "عبدالرحمن", "مريم", "صالح", "نجلاء", "ياسر", "هالة", "إبراهيم", "سمية", "حمزة", "ريم"];
  const last = ["الحميري", "العولقي", "باعباد", "الشامي", "المخلافي", "الكبسي", "بن بريك", "العريقي", "الصبري", "اليافعي", "القباطي", "الأهدل"];
  const statuses: ApplicationStatus[] = ["new", "new", "new", "in_review", "in_review", "contacted", "approved", "rejected", "closed"];
  const csUsers = [7, 8, 11];
  const maskPhone = () => `+967 7${pick(["1", "3", "7", "8"])}• ••• ${int(100, 999)}`;
  const maskId = () => `••••••${int(1000, 9999)}`;
  const mkInbox = (kind: InboxRecord["type"], prefix: string, i: number, details: Record<string, unknown>): InboxRecord => {
    const t = now - int(0, 29) * DAY - int(0, 86_000) * 1000;
    const status = t > now - 2 * DAY ? "new" : pick(statuses);
    const assigned = status === "new" ? null : author(pick(csUsers));
    const notes = status === "new" ? [] : [{ id: i * 10 + 1, body: pick(["تم الاتصال بالعميل وطلب استكمال المستندات.", "العميل يفضّل التواصل مساءً.", "تمت مراجعة البيانات الأولية."]), author: assigned?.name ?? "—", createdAt: iso(t + DAY / 2) }];
    const name = `${pick(first)} ${pick(first)} ${pick(last)}`;
    return {
      id: i + 1, reference: `WTQ-${prefix}-2026-${String(400 + i).padStart(6, "0")}`, type: kind, status, fullName: name, phoneMasked: maskPhone(),
      nationalIdMasked: kind === "contact" || kind === "job" ? "—" : maskId(), email: rnd() > 0.4 ? `client${i + 1}@mail.example` : null,
      city: pick(CITIES.slice(0, 8)).name.ar, locale: rnd() > 0.2 ? "ar" : "en", assignedTo: assigned, details, notes, createdAt: iso(t), updatedAt: iso(t + DAY / 2),
    };
  };
  const applications: InboxRecord[] = Array.from({ length: 62 }, (_, i) => {
    const type = (["account", "account", "financing", "financing", "financing", "card", "card"] as const)[i % 7]!;
    const details: Record<string, unknown> = type === "account" ? { accountType: pick(accountTypes), branchId: pick(branches).name.ar }
      : type === "financing" ? { financingProductId: pick(financing).name.ar, amount: int(5, 200) * 100_000, months: pick([12, 24, 36, 48]), monthlyIncome: int(15, 90) * 10_000, employer: pick(["قطاع خاص", "حكومي", "عمل حر"]) }
      : { cardId: pick(cards).name.ar, hasAccount: rnd() > 0.3, accountLast4: String(int(1000, 9999)) };
    return mkInbox(type, type === "account" ? "ACC" : type === "financing" ? "FIN" : "CRD", i, details);
  });
  const contact = Array.from({ length: 18 }, (_, i) => mkInbox("contact", "CB", i, {
    subject: pick(["general", "accounts", "financing", "cards", "digital"]), message: "أرغب في معرفة تفاصيل أكثر عن الخدمة وطريقة التقديم.", preferredTime: pick(["morning", "afternoon", "evening"]),
  }));
  const complaints = Array.from({ length: 16 }, (_, i) => mkInbox("complaint", "CMP", i, {
    category: pick(["service", "transaction", "staff", "digital", "fees"]), transactionDate: dateOnly(now - int(2, 40) * DAY),
    description: "تأخر تنفيذ حوالة لأكثر من يومين دون إشعار.", hasAttachment: i % 3 === 0,
  }));
  const jobApps = Array.from({ length: 14 }, (_, i) => mkInbox("job", "JOB", i, {
    job: (pick(jobs).title as Localized).ar, education: pick(["بكالوريوس محاسبة", "بكالوريوس تقنية معلومات", "ماجستير إدارة أعمال"]), experienceYears: int(0, 12),
    coverLetter: "أتطلع للانضمام إلى فريقكم والمساهمة في خدماتكم.",
  }));

  /* ───── audit ───── */
  const actions: AuditLogEntry["action"][] = ["login", "update", "update", "create", "publish", "login", "approve", "delete", "export", "change_permissions", "login_failed", "logout", "reject"];
  const resTypes = ["news", "pages", "services", "offers", "branches", "users", "roles", "media", "applications", "settings"];
  const audit: AuditLogEntry[] = Array.from({ length: 90 }, (_, i) => {
    const action = pick(actions);
    const u = pick(users);
    const rt = action === "login" || action === "logout" || action === "login_failed" ? null : action === "change_permissions" ? pick(["users", "roles"]) : action === "export" ? "applications" : pick(resTypes);
    const isNews = rt === "news";
    const label = rt ? (isNews ? pick(news).title.ar : rt === "pages" ? pick(pages).title.ar : rt === "users" ? pick(users).name : rt === "branches" ? pick(branches).name.ar : `${rt} #${int(1, 40)}`) : null;
    const changes = action === "update" ? { before: { status: "draft", title: "عنوان قديم" }, after: { status: "pending_review", title: label ?? "" } }
      : action === "change_permissions" ? { before: { roles: ["viewer"] }, after: { roles: ["viewer", "reviewer"] } }
      : action === "create" ? { after: { title: label ?? "", status: "draft" } } : action === "delete" ? { before: { title: label ?? "" } } : null;
    return {
      id: 90 - i, user: action === "login_failed" ? null : { id: u.id, name: u.name }, action, resourceType: rt, resourceId: rt ? String(int(1, 40)) : null, resourceLabel: label, changes,
      ipAddress: `10.20.${int(1, 40)}.${int(2, 250)}`, userAgent: pick(["Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/141.0", "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) Safari/18.0", "Mozilla/5.0 (X11; Linux x86_64) Firefox/143.0"]),
      createdAt: iso(now - (i * 30 * DAY) / 90 - int(0, 7200) * 1000),
    };
  });

  const settings: AdminSettings = {
    ...demoHome.settings,
    turnstileSiteKey: "0x4AAAAAAADemoSiteKey",
    defaultSeo: emptySeo(L("بنك وِثاق — خدمات مصرفية آمنة وقريبة منك", "Withaq Bank — secure banking close to you"),
      L("افتح حسابك، اطلب تمويلاً أو بطاقة، وابحث عن أقرب فرع. خدمات مصرفية متوافقة مع الشريعة في كل اليمن.", "Open an account, apply for financing or a card and find your nearest branch. Sharia-compliant banking across Yemen.")),
  };

  const sessions: AdminSession[] = [
    { id: "sess-current", ipAddress: "10.20.4.18", userAgent: "Chrome 141 · Windows", lastActiveAt: iso(now), current: true },
    { id: "sess-mobile", ipAddress: "10.20.9.77", userAgent: "Safari · iPhone", lastActiveAt: iso(now - 3 * 3600_000), current: false },
    { id: "sess-office", ipAddress: "10.20.1.5", userAgent: "Firefox 143 · Linux", lastActiveAt: iso(now - 2 * DAY), current: false },
  ];

  const asRecords = <T,>(a: T[]) => a as unknown as AnyRecord[];
  return {
    version: 3, seq: id,
    collections: {
      users: asRecords(users), roles: asRecords(roles), media: asRecords(media), services: asRecords(services), products: asRecords(products),
      "financing-products": asRecords(financing), cards: asRecords(cards), offers: asRecords(offers), banners: asRecords(banners),
      "faq-categories": asRecords(faqCats), faqs: asRecords(faqs), branches: asRecords(branches), atms: asRecords(atms), agents: asRecords(agents),
      jobs: asRecords(jobs), "news-categories": asRecords(newsCats), news: asRecords(news), pages: asRecords(pages), menus: asRecords(menus),
      applications: asRecords(applications), "contact-requests": asRecords(contact), complaints: asRecords(complaints), "job-applications": asRecords(jobApps),
      "audit-logs": asRecords(audit),
    },
    settings, sessions,
    auth: { userId: null, pending2fa: null, failed: {}, lockedUntil: {}, twoFactorSecret: null },
    notificationsReadAt: iso(now - 2 * DAY),
  };
  void nextId;
}

import type { AccountProduct, CardProduct, FinancingProduct, Service } from "@/types/content";

/**
 * Personal vs business segmentation for the /personal and /business landing pages.
 * Accounts use the contract's `accountType`; financing/cards are matched by slug (demo ids). Unknown products
 * published later from the CMS appear on the personal page by default so nothing silently disappears.
 */
export type Segment = "personal" | "business";

/* ═══ القسمةُ على منتجات بنك وثاق ═══
   وهو بنكُ تمويلٍ أصغر إسلامي: تمويلُه للمشاريع، فيظهر في صفحة الأعمال.
   ويبقى «الطاقة المتجدّدة» في الصفحتين — الدليلُ يذكر المنازلَ ضمن
   المناسبين له (وفق سياسة البنك). */
const BUSINESS_FINANCING = new Set([
  "tamweel-sawaeduna", "tamweel-bidayati", "tamweel-afiyati", "tamweel-ibdaa",
  "tamweel-sayedati", "tamweel-mawsimi", "tamweel-tharwa", "tamweel-mahsuli",
]);
const BUSINESS_CARDS = new Set(["prepaid-card", "business-card"]);
const BUSINESS_SERVICES = new Set([
  "withaq-net", "salam-net", "pos-terminals", "withaq-cash", "salam-cash", "withaq-card", "salam-card", "withaq-pay", "salam-pay", "call-center",
]);
const PERSONAL_SERVICES = new Set([
  "withaq-mobily", "withaq-mobile", "salam-mobily", "salam-mobile", "withaq-wallet", "salam-wallet", "withaq-cash", "salam-cash", "withaq-card", "salam-card", "withaq-sadad", "salam-sadad", "withaq-money", "salam-money",
]);

export const filterAccounts = (items: AccountProduct[], s: Segment) => items.filter((a) => (a.accountType === "business") === (s === "business"));
export const filterFinancing = (items: FinancingProduct[], s: Segment) => items.filter((f) => BUSINESS_FINANCING.has(f.id) === (s === "business"));
export const filterCards = (items: CardProduct[], s: Segment) => items.filter((c) => BUSINESS_CARDS.has(c.id) === (s === "business"));
export const filterServices = (items: Service[], s: Segment) => {
  const filtered = items.filter((x) => (s === "business" ? BUSINESS_SERVICES : PERSONAL_SERVICES).has(x.id));
  return (filtered.length > 0 ? filtered : items).slice(0, 6);
};

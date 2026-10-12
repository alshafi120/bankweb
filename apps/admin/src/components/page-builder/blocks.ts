import type { BlockDataMap, BlockType, HomeSectionType } from "@/types/api";
import type { HomeBlockKey, SectionType } from "@/types/admin";
import type { AnyIcon } from "@/components/ui/Icon";

const e = () => ({ ar: "", en: "" });

export const GENERIC_BLOCKS: { type: BlockType; icon: AnyIcon }[] = [
  { type: "hero", icon: "banner" }, { type: "text", icon: "page" }, { type: "image", icon: "image" }, { type: "cards", icon: "blocks" },
  { type: "features", icon: "sparkle" }, { type: "statistics", icon: "chart" }, { type: "faq", icon: "help" }, { type: "cta", icon: "arrow" },
  { type: "gallery", icon: "grid" }, { type: "video", icon: "video" }, { type: "map", icon: "map" }, { type: "people", icon: "users" }, { type: "documents", icon: "pdf" },
];

/** Built-in home blocks: data comes from catalog modules (block data is {}). `manage` = the module to edit instead. */
export const HOME_BLOCKS: { type: HomeSectionType; icon: AnyIcon; manage?: string }[] = [
  { type: "hero", icon: "banner", manage: "banners" }, { type: "services", icon: "layers", manage: "services" }, { type: "needs", icon: "help", manage: "services" },
  { type: "accounts", icon: "account", manage: "products" }, { type: "financing", icon: "financing", manage: "financing-products" }, { type: "digital", icon: "mobile", manage: "services" },
  { type: "cards", icon: "card", manage: "cards" }, { type: "network", icon: "branch", manage: "branches" }, { type: "news", icon: "news", manage: "news" },
  { type: "offers", icon: "sparkle", manage: "offers" }, { type: "why", icon: "shield", manage: "settings" }, { type: "app", icon: "mobile", manage: "settings" },
  { type: "faq", icon: "help", manage: "faqs" }, { type: "cta", icon: "arrow", manage: "settings" },
];

export const isHomeBlock = (t: SectionType): t is HomeBlockKey => t.startsWith("home:");
export const blockIcon = (t: SectionType): AnyIcon =>
  isHomeBlock(t) ? HOME_BLOCKS.find((b) => `home:${b.type}` === t)?.icon ?? "blocks" : GENERIC_BLOCKS.find((b) => b.type === t)?.icon ?? "blocks";

export function defaultData<K extends BlockType>(type: K): BlockDataMap[K] {
  const map: { [T in BlockType]: BlockDataMap[T] } = {
    hero: { title: e(), subtitle: e(), image: null, primary: { label: e(), href: "/" }, secondary: null },
    text: { heading: e(), body: e() },
    image: { image: { id: 0, url: "", alt: e(), mime: "image/jpeg" }, caption: e() },
    cards: { heading: e(), items: [{ icon: "account", title: e(), body: e(), href: "" }] },
    features: { heading: e(), body: e(), items: [{ icon: "shield", title: e(), body: e() }] },
    statistics: { heading: e(), items: [{ value: 0, suffix: "", label: e() }] },
    faq: { heading: e(), items: [{ question: e(), answer: e() }] },
    cta: { title: e(), body: e(), primary: { label: e(), href: "/" }, secondary: null },
    gallery: { heading: e(), images: [] },
    video: { heading: e(), url: "", poster: null },
    map: { heading: e(), type: "branch", city: null },
    people: { heading: e(), items: [{ name: e(), role: e(), bio: e(), photo: null }] },
    documents: { heading: e(), items: [] },
  };
  return structuredClone(map[type]);
}

import type { IconName } from "@/types/content";

/** Stroke icon set (24px grid, 1.6 stroke). Kept in one file so the CMS can reference icons by name. */
const paths: Record<IconName | "arrow" | "phone" | "mail" | "menu" | "close" | "chevron" | "pin" | "clock" | "globe", string> = {
  account: "M4 7h16v12H4zM4 11h16M8 15h3",
  financing: "M4 19V9l8-5 8 5v10M9 19v-6h6v6M3 19h18",
  transfer: "M7 7h12l-3-3M17 17H5l3 3",
  card: "M3 6h18v12H3zM3 10h18M7 15h4",
  payment: "M5 4h14v16l-3-2-2 2-2-2-2 2-2-2-3 2zM9 9h6M9 13h6",
  digital: "M8 3h8v18H8zM11 18h2",
  send: "M4 12l16-8-6 16-2-7z",
  receive: "M12 4v12M6 11l6 6 6-6M5 20h14",
  branch: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  shield: "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6zM9 12l2 2 4-4",
  network: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18",
  speed: "M13 3L5 14h6l-1 7 8-11h-6z",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  support: "M4 13v-1a8 8 0 0 1 16 0v1M4 13h3v5H4zM17 13h3v5h-3zM20 18c0 2-2 3-5 3h-2",
  mobile: "M8 3h8v18H8zM11 18h2",
  web: "M3 5h18v12H3zM8 21h8M12 17v4",
  wallet: "M4 7h14a2 2 0 0 1 2 2v9H4zM4 7l11-3v3M16 13h2",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2",
  arrow: "M5 12h14M13 6l6 6-6 6",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
  chevron: "M6 9l6 6 6-6",
  pin: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.7 2.5 15.3 0 18",
};

export type AnyIcon = keyof typeof paths;

export function Icon({ name, className = "size-5", directional = false }: { name: AnyIcon; className?: string; directional?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" className={`${className} ${directional ? "rtl:-scale-x-100" : ""}`}>
      <path d={paths[name]} />
    </svg>
  );
}

import type { SiteSettings } from "@/types/content";

const glyphs: Record<keyof SiteSettings["social"], { label: string; d: string }> = {
  facebook: { label: "Facebook", d: "M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v8h4v-8h3l1-4h-4V8z" },
  instagram: { label: "Instagram", d: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5.5-2.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" },
  x: { label: "X", d: "M4 4h4.5l4 5.6L17 4h3l-6.1 7.3L21 20h-4.5l-4.4-6.1L7 20H4l6.6-7.9z" },
  linkedin: { label: "LinkedIn", d: "M4 9h4v11H4zM6 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM10 9h4v1.6c.6-1 1.9-1.9 3.6-1.9C20.4 8.7 21 10.6 21 13v7h-4v-6.2c0-1.4-.3-2.6-1.8-2.6s-1.9 1.1-1.9 2.6V20h-3.3z" },
  youtube: { label: "YouTube", d: "M22 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.8-1.8C18.3 5 12 5 12 5s-6.3 0-7.8.5a2.5 2.5 0 0 0-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.8 1.8C5.7 19 12 19 12 19s6.3 0 7.8-.5a2.5 2.5 0 0 0 1.8-1.8c.4-1.5.4-4.7.4-4.7zM10 15V9l5 3z" },
};

export function SocialLinks({ social, size = "size-4", className = "" }: { social: SiteSettings["social"]; size?: string; className?: string }) {
  return (
    <ul className={`flex items-center gap-3 ${className}`}>
      {(Object.keys(glyphs) as (keyof typeof glyphs)[]).map((k) => (
        <li key={k}>
          <a href={social[k]} target="_blank" rel="noopener noreferrer" aria-label={glyphs[k].label} className="opacity-80 transition hover:opacity-100">
            <svg viewBox="0 0 24 24" className={size} fill="currentColor" aria-hidden="true"><path d={glyphs[k].d} /></svg>
          </a>
        </li>
      ))}
    </ul>
  );
}

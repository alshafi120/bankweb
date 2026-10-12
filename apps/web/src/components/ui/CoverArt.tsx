import clsx from "clsx";

/**
 * Placeholder artwork for news/offers until the CMS media library supplies a featured image.
 * Deterministic per seed so the same item always looks the same. Swap for <Image> when `image` is a real URL.
 */
export function CoverArt({ seed, label, tone = "brand", className }: { seed: string; label?: string; tone?: "brand" | "accent"; className?: string }) {
  const n = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
  const angle = (n * 37) % 360;
  const base = tone === "accent"
    ? "linear-gradient(135deg, rgb(var(--accent)), rgb(var(--brand-900)))"
    : `linear-gradient(${angle}deg, rgb(var(--brand-900)), rgb(var(--brand-700)) 60%, rgb(var(--secondary)))`;
  return (
    <div className={clsx("relative overflow-hidden", className)} style={{ background: base }} role="presentation">
      <div className="qamariya-pattern absolute inset-0" />
      <div className="absolute -bottom-1/3 start-1/4 aspect-square w-1/2 rounded-full border border-white/20" />
      {label && <span className="absolute start-4 top-4 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">{label}</span>}
    </div>
  );
}

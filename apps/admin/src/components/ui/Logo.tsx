/** علامةُ بنك السلام كابيتال — مأخوذةٌ من دليل البنك، كما في apps/web. */
export function LogoMark({ light = false, className = "size-8" }: { light?: boolean; className?: string }) {
  return (
    <img
      src={light ? "/brand/mark-white.png" : "/brand/mark-navy.png"}
      alt=""
      aria-hidden="true"
      className={`${className} shrink-0 object-contain`}
      decoding="async"
    />
  );
}

export function Logo({ name, sub, light = false, compact = false }: { name: string; sub?: string; light?: boolean; compact?: boolean }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2.5">
      <LogoMark light={light} />
      {!compact && (
        <span className="min-w-0 leading-tight">
          <span className={`block truncate text-[15px] font-bold ${light ? "text-white" : "text-brand-900 dark:text-white"}`}>{name}</span>
          {sub && <span className={`block truncate text-2xs font-medium ${light ? "text-white/60" : "text-muted"}`}>{sub}</span>}
        </span>
      )}
    </span>
  );
}

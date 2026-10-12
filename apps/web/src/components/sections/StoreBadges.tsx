import type { SiteSettings } from "@/types/content";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function StoreBadges({ settings, dict, className = "" }: { settings: SiteSettings; dict: Dictionary; className?: string }) {
  const stores = [
    { url: settings.appStores.googlePlay, name: dict.app.googlePlay, d: "M4 3l10 9-10 9zM14 12l3-3 4 2.3c.8.5.8 1 0 1.4L17 15zM4 3l13 6M4 21l13-6" },
    { url: settings.appStores.appStore, name: dict.app.appStore, d: "M16 3c0 2-1.5 3.5-3 3.5C13 4.6 14.5 3 16 3zM12 7.5c1 0 2-.7 3.3-.7 1.2 0 2.5.6 3.2 1.8-2.8 1.6-2.3 5.6.5 6.7-.6 1.7-1.8 4.7-3.6 4.7-1.3 0-1.6-.8-3.2-.8s-2 .8-3.3.8C6.9 20 5 16.4 5 13.3 5 9.8 7.3 8 9 8c1.3 0 2.2.7 3 .7" },
  ];
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {stores.map((s) => (
        <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-3 rounded-xl bg-[#0A1F1D] px-4 text-white transition hover:bg-black">
          <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden="true"><path d={s.d} /></svg>
          <span className="grid leading-tight"><span className="text-[10px] text-white/70">{dict.app.getIt}</span><span className="text-sm font-semibold" dir="ltr">{s.name}</span></span>
        </a>
      ))}
    </div>
  );
}

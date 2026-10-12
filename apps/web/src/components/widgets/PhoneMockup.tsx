import type { Dictionary } from "@/lib/i18n/dictionaries";

/** App mockup drawn in markup (no image request, crisp on every screen, translatable). */
export function PhoneMockup({ dict, className = "" }: { dict: Dictionary; className?: string }) {
  const h = dict.hero;
  return (
    <div className={`relative mx-auto w-[260px] rounded-[42px] border-[10px] border-[#0A1F1D] bg-[#0A1F1D] shadow-2xl ${className}`}>
      <div className="overflow-hidden rounded-[32px] bg-surface text-ink">
        <div className="bg-brand-900 px-5 pb-6 pt-8 text-white">
          <p className="text-xs text-white/70">{h.phoneGreeting}</p>
          <p className="mt-4 text-[11px] text-white/60">{h.phoneBalance}</p>
          <p className="tabular font-mono text-2xl font-semibold" dir="ltr">1,248,350 <span className="text-sm text-accent">{dict.currency}</span></p>
        </div>
        <div className="-mt-4 mx-3 grid grid-cols-4 gap-1 rounded-2xl bg-surface p-2 shadow-lift">
          {h.phoneActions.map((a) => (
            <span key={a} className="grid justify-items-center gap-1 py-1 text-[10px] font-medium">
              <span className="size-7 rounded-xl bg-brand-100" />{a}
            </span>
          ))}
        </div>
        <div className="px-4 pb-6 pt-4">
          <p className="mb-2 text-[11px] font-semibold text-muted">{h.phoneRecent}</p>
          <ul className="grid gap-2">
            {h.phoneTx.map(([label, amt]) => (
              <li key={label} className="flex items-center justify-between rounded-xl bg-bg px-3 py-2 text-[11px]">
                <span>{label}</span>
                <span dir="ltr" className={`tabular font-mono font-semibold ${amt!.startsWith("+") ? "text-success" : ""}`}>{amt}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

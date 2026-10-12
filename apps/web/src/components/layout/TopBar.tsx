import type { Locale, SiteSettings } from "@/types/content";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { Icon } from "@/components/ui/Icon";
import { SocialLinks } from "./SocialLinks";

export function TopBar({ dict, settings }: { dict: Dictionary; settings: SiteSettings; locale: Locale }) {
  return (
    <div className="hidden bg-brand-900 text-[13px] text-white/80 md:block">
      <div className="container flex h-9 items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <span className="font-medium text-white">{dict.topbar.care}</span>
          <a href={`tel:${settings.tollFree.replace(/\s/g, "")}`} className="flex items-center gap-1.5 hover:text-white" dir="ltr">
            <Icon name="phone" className="size-3.5" /> {settings.tollFree}
          </a>
          <a href={`mailto:${settings.email}`} className="flex items-center gap-1.5 hover:text-white">
            <Icon name="mail" className="size-3.5" /> {settings.email}
          </a>
        </div>
        <div className="flex items-center gap-5">
          <SocialLinks social={settings.social} size="size-3.5" />
          <a href={settings.internetBankingUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent hover:underline">
            {dict.topbar.internetBanking}
          </a>
        </div>
      </div>
    </div>
  );
}

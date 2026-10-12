import type { SectionProps } from "./types";
import { href } from "@/lib/i18n/config";
import { ButtonLink } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import { PhoneMockup } from "@/components/widgets/PhoneMockup";

/**
 * The background is drawn (gradient + qamariya lattice) so the hero ships with zero image weight
 * and passes LCP on 3G. The CMS can set a background image/video; it renders behind the same overlay.
 */
export function Hero({ locale, dict }: SectionProps) {
  const h = dict.hero;
  return (
    <section className="relative overflow-hidden bg-brand-900 text-white">
      {/* عمقان لا واحد: الشبكةُ تتبع التمريرَ بخُمسه والهالةُ بثُلثه،
          فيُقرأ بينهما بُعد. والنصُّ لا يتحرّك — ما يُقرأ لا يُزاح. */}
      <div className="qamariya-pattern absolute inset-0 will-change-transform" aria-hidden="true" data-parallax="0.2" />
      <div className="absolute -end-40 -top-40 size-[520px] rounded-full bg-[radial-gradient(circle,rgb(var(--accent)/.28),transparent_65%)] will-change-transform" aria-hidden="true" data-parallax="0.34" />
      <div className="container relative grid items-center gap-12 py-14 md:py-20 lg:grid-cols-[1.2fr_1fr] lg:py-24">
        {/* `hero-in` تُرتّب أبناءَها الخمسةَ تتابعاً — لا تنتظر تمريراً:\n            هي أوّلُ ما يُرى، وانتظارُها عبث. */}\n        <div className="hero-in max-w-xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-[13px] text-white/85">
            <span className="size-1.5 rounded-full bg-accent" />{h.eyebrow}
          </p>
          <h1 className="text-[34px] font-bold leading-tight md:text-[48px] lg:text-[56px]">{h.title}</h1>
          <p className="mt-5 text-lg text-white/80">{h.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={href(locale, "/apply/account")} variant="accent" arrow>{h.primary}</ButtonLink>
            <ButtonLink href={href(locale, "/services")} variant="onDark">{h.secondary}</ButtonLink>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
            {h.trust.map((x) => <li key={x} className="flex items-center gap-2"><Icon name="shield" className="size-4 text-accent" />{x}</li>)}
          </ul>
        </div>
        <div className="hero-art relative hidden justify-center sm:flex">
          {/* Arch frame echoing the qamariya window */}
          <div className="absolute inset-x-0 bottom-0 mx-auto h-[86%] w-[340px] rounded-arch border border-white/15 bg-white/[.04]" aria-hidden="true" />
          <PhoneMockup dict={dict} className="hero-float relative" />
        </div>
      </div>
    </section>
  );
}

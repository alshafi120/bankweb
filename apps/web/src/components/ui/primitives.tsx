import Link from "next/link";
import clsx from "clsx";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

type Variant = "accent" | "primary" | "ghost" | "onDark";

const variants: Record<Variant, string> = {
  accent: "bg-accent text-brand-900 hover:brightness-105 shadow-lift",
  primary: "bg-brand-900 text-white hover:bg-brand-700",
  ghost: "border border-line text-ink hover:border-brand-700 hover:text-brand-700",
  onDark: "border border-white/30 text-white hover:bg-white/10",
};

export function ButtonLink({ href, children, variant = "primary", arrow = false, className }: {
  href: string; children: ReactNode; variant?: Variant; arrow?: boolean; className?: string;
}) {
  const external = href.startsWith("http");
  return (
    <Link href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={clsx("press inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold transition duration-200 ease-bank",
        variant === "accent" && "sheen", variants[variant], className)}>
      {children}
      {arrow && <Icon name="arrow" className="size-4" directional />}
    </Link>
  );
}

export function SectionHeader({ eyebrow, title, body, action, onDark = false }: {
  eyebrow: string; title: string; body?: string; action?: ReactNode; onDark?: boolean;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-12">
      <div className="rule-draw max-w-2xl">
        <p className={clsx("mb-2 text-[13px] font-semibold tracking-wide", onDark ? "text-accent" : "text-brand-700")}>{eyebrow}</p>
        <h2 className={clsx("text-[26px] font-bold md:text-[38px]", onDark ? "text-white" : "text-ink")}>{title}</h2>
        {body && <p className={clsx("mt-3 text-base", onDark ? "text-white/75" : "text-muted")}>{body}</p>}
      </div>
      {action}
    </div>
  );
}

export function Section({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={clsx("scroll-mt-28 py-16 md:py-24", className)}>
      {/* `data-reveal` هنا وحدَها تكفي الموقعَ كلَّه: كلُّ قسمٍ يمرُّ بها.
          و`Motion.tsx` يراقبها، والقاعدةُ في globals.css تُخفيها **بعد**
          أن تعمل جافاسكربت لا قبلها. */}
      <div className="container" data-reveal>{children}</div>
    </section>
  );
}

export function IconBadge({ name, className }: { name: Parameters<typeof Icon>[0]["name"]; className?: string }) {
  return (
    <span className={clsx("grid size-12 place-items-center rounded-card bg-brand-100 text-brand-700", className)}>
      <Icon name={name} className="size-6" />
    </span>
  );
}

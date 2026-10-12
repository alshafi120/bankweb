"use client";

import Link from "next/link";
import clsx from "clsx";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Icon, type AnyIcon } from "./Icon";

export type ButtonVariant = "primary" | "accent" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "icon" | "iconSm";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand-900 text-white hover:bg-brand-700 dark:bg-brand-700 dark:text-bg dark:hover:brightness-110",
  accent: "bg-accent text-brand-900 hover:brightness-105 shadow-lift",
  secondary: "border border-line bg-surface text-ink hover:border-muted/50 hover:bg-raised",
  ghost: "text-ink/80 hover:bg-line/40 hover:text-ink",
  subtle: "bg-brand-100 text-brand-700 hover:brightness-95 dark:hover:brightness-125",
  danger: "bg-danger text-white hover:brightness-110 dark:text-bg",
};
const sizes: Record<Size, string> = {
  sm: "h-8 gap-1.5 rounded-lg px-2.5 text-sm",
  md: "h-9 gap-2 rounded-lg px-3.5 text-base",
  icon: "size-9 rounded-lg",
  iconSm: "size-8 rounded-lg",
};

export const buttonClass = (variant: ButtonVariant = "secondary", size: Size = "md", className?: string) =>
  clsx("inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-semibold transition duration-150 ease-bank disabled:pointer-events-none disabled:opacity-50", variants[variant], sizes[size], className);

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant; size?: Size; icon?: AnyIcon; iconEnd?: AnyIcon; loading?: boolean; children?: ReactNode; directional?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "secondary", size = "md", icon, iconEnd, loading, children, className, type = "button", disabled, directional, ...rest }, ref,
) {
  const iconCls = size === "sm" || size === "iconSm" ? "size-4" : "size-[18px]";
  return (
    <button ref={ref} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={buttonClass(variant, size, className)} {...rest}>
      {loading ? <Spinner className={iconCls} /> : icon ? <Icon name={icon} className={iconCls} directional={directional} /> : null}
      {children}
      {iconEnd && <Icon name={iconEnd} className={iconCls} directional={directional} />}
    </button>
  );
});

export function ButtonLink({ href, variant = "secondary", size = "md", icon, children, className, directional, ...rest }: {
  href: string; variant?: ButtonVariant; size?: Size; icon?: AnyIcon; children?: ReactNode; className?: string; directional?: boolean; "aria-label"?: string; title?: string;
}) {
  const iconCls = size === "sm" || size === "iconSm" ? "size-4" : "size-[18px]";
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {icon && <Icon name={icon} className={iconCls} directional={directional} />}
      {children}
    </Link>
  );
}

export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={clsx("animate-spin", className)} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

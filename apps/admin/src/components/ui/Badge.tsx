"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { useI18n } from "@/components/providers/I18nProvider";

export type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info" | "accent";
const tones: Record<Tone, string> = {
  neutral: "bg-line/50 text-ink/80",
  brand: "bg-brand-100 text-brand-700",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/12 text-danger",
  info: "bg-secondary/12 text-secondary",
  accent: "bg-accent/15 text-accent",
};
const dots: Record<Tone, string> = {
  neutral: "bg-muted", brand: "bg-brand-700", success: "bg-success", warning: "bg-warning", danger: "bg-danger", info: "bg-secondary", accent: "bg-accent",
};

export function Badge({ tone = "neutral", children, dot = false, className }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={clsx("inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-xs font-semibold", tones[tone], className)}>
      {dot && <span className={clsx("size-1.5 rounded-full", dots[tone])} aria-hidden="true" />}
      {children}
    </span>
  );
}

export const STATUS_TONE: Record<string, Tone> = {
  draft: "neutral", pending_review: "warning", approved: "info", published: "success", scheduled: "accent", archived: "neutral",
  active: "success", inactive: "neutral", closed: "neutral", new: "info", in_review: "warning", contacted: "brand", rejected: "danger",
};

/** Status is always icon-dot + label, never color alone. */
export function StatusBadge({ status }: { status: string }) {
  const { d } = useI18n();
  const label = (d.status as Record<string, string>)[status] ?? status;
  return <Badge tone={STATUS_TONE[status] ?? "neutral"} dot>{label}</Badge>;
}

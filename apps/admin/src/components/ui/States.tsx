"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { Icon, type AnyIcon } from "./Icon";
import { ButtonLink, Button } from "./Button";
import { useI18n } from "@/components/providers/I18nProvider";
import { isApiError } from "@/lib/api/errors";

export function Skeleton({ className }: { className?: string }) {
  return <span className={clsx("skeleton block", className)} aria-hidden="true" />;
}

export function EmptyState({ icon = "folder", title, body, action, className }: { icon?: AnyIcon; title: string; body?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={clsx("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      <span className="mb-3 grid size-12 place-items-center rounded-arch bg-brand-100 text-brand-700"><Icon name={icon} className="size-6" /></span>
      <p className="font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Forbidden() {
  const { d, locale } = useI18n();
  return (
    <div className="card mx-auto mt-6 max-w-lg">
      <EmptyState icon="lock" title={d.errors.forbidden} body={d.errors.forbiddenBody}
        action={<ButtonLink href={`/${locale}`} variant="secondary" icon="home">{d.errors.home}</ButtonLink>} />
    </div>
  );
}

export function NotFoundState() {
  const { d, locale } = useI18n();
  return (
    <div className="card mx-auto mt-6 max-w-lg">
      <EmptyState icon="search" title={d.errors.notFound} body={d.errors.notFoundBody}
        action={<ButtonLink href={`/${locale}`} variant="secondary" icon="home">{d.errors.home}</ButtonLink>} />
    </div>
  );
}

/** Maps an API error to the right full-screen state (403 → no permission, 404 → not found, otherwise retry). */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { d, f } = useI18n();
  if (isApiError(error) && error.kind === "forbidden") return <Forbidden />;
  if (isApiError(error) && error.kind === "not_found") return <NotFoundState />;
  const msg = isApiError(error)
    ? error.kind === "network" ? d.errors.network : error.kind === "rate_limited" ? f(d.errors.rateLimited, { seconds: error.retryAfter ?? 30 }) : error.kind === "locked" ? d.errors.locked : d.errors.generic
    : d.errors.generic;
  return (
    <div className="card mx-auto mt-6 max-w-lg" role="alert">
      <EmptyState icon="alert" title={d.errors.title} body={msg} action={onRetry && <Button icon="refresh" onClick={onRetry}>{d.common.retry}</Button>} />
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-xs font-semibold text-brand-700">{eyebrow}</div>}
        <h1 className="text-[20px] font-bold leading-tight sm:text-[22px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, description, actions, children, className, bodyClassName, id }: {
  title?: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string; id?: string;
}) {
  return (
    <section id={id} className={clsx("card", className)} aria-labelledby={title && id ? `${id}-title` : undefined}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-4 py-3">
          <div className="min-w-0">
            {title && <h2 id={id ? `${id}-title` : undefined} className="text-[15px] font-bold">{title}</h2>}
            {description && <p className="text-xs text-muted">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={clsx("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

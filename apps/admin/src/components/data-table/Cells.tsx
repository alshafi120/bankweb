"use client";

import { useEffect, useState } from "react";
import type { Localized, MediaRef, Role, IconName } from "@/types/api";
import type { AnyRecord } from "@/types/admin";
import type { ColumnDef } from "@/resources/types";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { MediaThumb } from "@/components/media/MediaThumb";
import { useI18n } from "@/components/providers/I18nProvider";
import { formatDate, formatDateTime, formatMoney, formatNumber, tl } from "@/lib/i18n/config";
import { resourceApi } from "@/lib/api/endpoints";
import { loadRelation } from "@/lib/hooks/useAsync";

export function useRelationLabels(cols: ColumnDef[]) {
  const [maps, setMaps] = useState<Record<string, Record<string, Localized>>>({});
  const rels = cols.filter((c) => c.kind === "relation" && c.relation);
  const key = rels.map((c) => c.relation!.endpoint).join(",");
  useEffect(() => {
    rels.forEach((c) => {
      const { endpoint, labelKey } = c.relation!;
      loadRelation(endpoint, labelKey, "id", () => resourceApi.list(endpoint, { perPage: 100 }))
        .then((opts) => setMaps((m) => ({ ...m, [c.key]: Object.fromEntries(opts.map((o) => [o.value, o.label])) })))
        .catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return maps;
}

/** Renders one cell according to its column kind. Everything is text — no HTML injection. */
export function Cell({ col, row, relations }: { col: ColumnDef; row: AnyRecord; relations: Record<string, Record<string, Localized>> }) {
  const { d, locale } = useI18n();
  const v = row[col.key];
  switch (col.kind) {
    case "title": {
      const main = typeof v === "string" ? v : tl(v as Localized, locale);
      const sub = col.subKey ? row[col.subKey] : undefined;
      return (
        <span className="block min-w-0">
          <span className="block truncate font-semibold text-ink">{main || <span className="text-muted">{d.common.untitled}</span>}</span>
          {sub != null && sub !== "" && <span className="num block truncate text-xs text-muted" dir="ltr">{String(sub)}</span>}
        </span>
      );
    }
    case "localized": return <span className="truncate">{tl(v as Localized, locale) || "—"}</span>;
    case "status": return <StatusBadge status={String(v ?? "")} />;
    case "date": return <span className="num whitespace-nowrap text-xs text-muted">{formatDate(v as string, locale)}</span>;
    case "datetime": return <span className="num whitespace-nowrap text-xs text-muted">{formatDateTime(v as string, locale)}</span>;
    case "money": return <span className="num whitespace-nowrap">{v == null ? "—" : formatMoney(Number(v), locale)}</span>;
    case "number": return <span className="num">{v == null ? "—" : formatNumber(Number(v), locale)}</span>;
    case "percent": return <span className="num">{v == null ? "—" : `${formatNumber(Number(v), locale)}%`}</span>;
    case "count": return <span className="num text-muted">{Array.isArray(v) ? formatNumber(v.length, locale) : "—"}</span>;
    case "mono": return <span className="num text-xs" dir="ltr">{String(v ?? "—")}</span>;
    case "boolean": return v
      ? <span className="inline-flex items-center gap-1 text-success"><Icon name="checkCircle" className="size-4" /><span className="sr-only">{d.common.yes}</span></span>
      : <span className="inline-flex items-center gap-1 text-muted"><Icon name="minus" className="size-4" /><span className="sr-only">{d.common.no}</span></span>;
    case "media": return <MediaThumb media={v as MediaRef | null} className="h-9 w-12" />;
    case "icon": return <span className="grid size-8 place-items-center rounded-md bg-brand-100 text-brand-700">{v ? <Icon name={v as IconName} className="size-4" /> : null}</span>;
    case "relation": { const m = relations[col.key]; return <span className="truncate">{v == null ? "—" : m?.[String(v)] ? tl(m[String(v)], locale) : "…"}</span>; }
    case "badge": { const o = col.options?.find((x) => x.value === String(v)); return v == null ? <span>—</span> : <Badge tone="neutral">{o ? tl(o.label, locale) : String(v)}</Badge>; }
    case "roles": return (
      <span className="flex flex-wrap gap-1">{((v as Role[]) ?? []).map((r) => <Badge key={r} tone={r === "super_admin" ? "accent" : "brand"}>{(d.roles as Record<string, string>)[r] ?? r}</Badge>)}</span>
    );
    case "text": default: {
      if (v && typeof v === "object" && "name" in (v as object)) return <span className="truncate">{String((v as { name: string }).name)}</span>;
      return <span className="truncate">{v == null || v === "" ? "—" : String(v)}</span>;
    }
  }
}

/** Plain-text value for CSV export. */
export function cellText(col: ColumnDef, row: AnyRecord, locale: "ar" | "en", relations: Record<string, Record<string, Localized>>): string {
  const v = row[col.key];
  if (v == null) return "";
  if (col.kind === "relation") return tl(relations[col.key]?.[String(v)], locale);
  if (col.kind === "count" && Array.isArray(v)) return String(v.length);
  if (col.kind === "media") return (v as MediaRef).url?.startsWith("data:") ? `#${(v as MediaRef).id}` : (v as MediaRef).url;
  if (col.kind === "badge") return tl(col.options?.find((o) => o.value === String(v))?.label, locale) || String(v);
  if (Array.isArray(v)) return v.join(" | ");
  if (typeof v === "object" && "ar" in (v as object)) return tl(v as Localized, locale);
  if (typeof v === "object" && "name" in (v as object)) return String((v as { name: string }).name);
  return String(v);
}

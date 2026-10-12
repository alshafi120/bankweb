"use client";

import { Suspense } from "react";
import { getResource } from "@/resources";
import { NotFoundState, Skeleton } from "@/components/ui/States";
import { ResourceList } from "./ResourceList";
import { ResourceEdit } from "./ResourceEdit";

/** Client entry for the generic routes: resolves the resource config by key. */
export function ResourceRoute({ resource, id, mode }: { resource: string; id?: string; mode: "list" | "new" | "edit" }) {
  const def = getResource(resource);
  if (!def) return <NotFoundState />;
  if (mode === "list") return <Suspense fallback={<Skeleton className="h-96 w-full rounded-card" />}><ResourceList def={def} /></Suspense>;
  if (mode === "new") return <ResourceEdit key="new" def={def} id={null} />;
  if (!id || !/^\d+$/.test(id)) return <NotFoundState />;
  return <ResourceEdit key={id} def={def} id={id} />;
}

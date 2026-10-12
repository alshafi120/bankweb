"use client";

import { MediaBrowser } from "@/components/media/MediaBrowser";
import { Forbidden, PageHeader } from "@/components/ui/States";
import { useI18n } from "@/components/providers/I18nProvider";
import { useAuth } from "@/components/providers/AuthProvider";

export function MediaScreen() {
  const { d } = useI18n();
  const { can } = useAuth();
  if (!can("media.view")) return <Forbidden />;
  return (
    <div>
      <PageHeader title={d.media.title} subtitle={d.media.accepted} />
      <MediaBrowser mode="manage" />
    </div>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Sends one page view per route change via navigator.sendBeacon (no cookies, no IDs, respects Do-Not-Track/GPC). */
export function PageViewBeacon() {
  const pathname = usePathname();
  useEffect(() => {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return;
    const body = JSON.stringify({ path: pathname, referrer: document.referrer || undefined });
    const blob = new Blob([body], { type: "application/json" });
    if (!nav.sendBeacon?.("/api/track", blob)) {
      fetch("/api/track", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
    }
  }, [pathname]);
  return null;
}

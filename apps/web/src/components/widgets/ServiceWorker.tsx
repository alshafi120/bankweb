"use client";

import { useEffect } from "react";

/**
 * تسجيلُ عامل الخدمة — ليُثبَّت الموقعُ تطبيقاً على الجوّال.
 *
 * ولا يُسجَّل إلّا في سياقٍ آمن (https أو localhost): المتصفّحُ يرفضه
 * على http عاديٍّ فيرمي خطأً في السجلّ بلا فائدة. وفي التطوير يُترك
 * كذلك — المخزنُ يُخفي تغييراتِ الشيفرة فيُظنُّ أنّها لم تُحفظ.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    if (!window.isSecureContext) return;
    const id = window.setTimeout(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }, 1200); // بعد أن تستقرّ الصفحة، فلا يزاحم تحميلَها
    return () => window.clearTimeout(id);
  }, []);
  return null;
}

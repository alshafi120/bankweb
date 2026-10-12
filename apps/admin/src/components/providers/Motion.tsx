"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * طبقةُ الحركة في اللوحة — أهدأُ من حركة الموقع عمداً.
 *
 * الموقعُ يُقنع، واللوحةُ تُشتغَل عليها عشرَ ساعاتٍ في اليوم: فالحركةُ
 * فيها **إشارةٌ لا عرض**. مدىً أقصرُ (٣٢٠ مللي)، وإزاحةٌ أصغرُ (١٠ بكسل)،
 * ولا طفوَ ولا بريق.
 *
 * ولا يُخفى شيءٌ إلّا بعد أن تعمل جافاسكربت (`html.js-motion`)، ومن طلب
 * السكون لم يُنشأ له مراقبٌ أصلاً — وهما الحكمان نفسُهما في الموقع.
 *
 * والمراقبُ يُعاد عند تبدّل الصفحة: اللوحةُ تطبيقٌ من صفحةٍ واحدة،
 * فما يُرسَم بعد التنقّل لا يمرُّ بتحميلٍ جديد.
 */
export function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    document.documentElement.classList.add("js-motion");

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );

    const watch = () =>
      document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)").forEach((el) => io.observe(el));

    watch();
    const mo = new MutationObserver(watch);
    mo.observe(document.body, { childList: true, subtree: true });
    const t = window.setTimeout(watch, 400);

    return () => { io.disconnect(); mo.disconnect(); window.clearTimeout(t); };
  }, [pathname]);

  return null;
}

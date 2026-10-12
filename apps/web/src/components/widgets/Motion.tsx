"use client";

import { useEffect } from "react";

/**
 * طبقةُ الحركة — تُشغَّل من المتصفّح وحدَه.
 *
 * ═══ ولا يُخفى شيءٌ إلّا بعد أن تعمل ═══
 * القاعدةُ في `globals.css` تُخفي `[data-reveal]` **تحت `html.js-motion`
 * وحدَها**، وهذا الصنفُ لا يُضاف إلّا من هنا. فلو تعطّلت جافاسكربت أو
 * بطأت، ظهر المحتوى كاملاً كما هو — ولا يقع ما هو أسوأُ من حركة: صفحةٌ
 * بيضاء لأنّ مراقبَ التمرير لم يعمل.
 *
 * ═══ ومن طلب السكون أُجيب ═══
 * `prefers-reduced-motion` يُفحص قبل كلِّ شيء: لا صنفَ يُضاف ولا مراقبَ
 * يُنشأ — فالصفحةُ ساكنةٌ تماماً لا «حركةٌ سريعة».
 */
export function Motion() {
  useEffect(() => {
    const quiet = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (quiet?.matches) return;

    const root = document.documentElement;
    root.classList.add("js-motion");

    /* الظهورُ عند بلوغ العنصر ثُلثَ الشاشة، ثمّ يُترك: الحركةُ تقع مرّةً
       ولا تتكرّر مع كلِّ صعودٍ ونزول — وهو ما يُفرّق بين موقعٍ حيٍّ وموقعٍ
       مُتعَب. و`rootMargin` السالبُ من الأسفل يمنع إطلاقَها قبل أن تُرى. */
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    const watch = () => {
      document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)").forEach((el) => io.observe(el));
    };
    watch();

    /* ما وُلد بعد التحميل (محتوًى يُجلب، أو قائمةٌ تُفتح) يُراقَب كذلك. */
    const mo = new MutationObserver(watch);
    mo.observe(document.body, { childList: true, subtree: true });

    /* وما كان في الشاشة أصلاً عند التحميل يظهر فوراً ولو لم يتحرّك
       المستخدم — المراقبُ يُطلق أوّلَ مرّةٍ من تلقائه، وهذا حارسٌ لو
       تأخّر الرسم. */
    const t = window.setTimeout(watch, 600);

    return () => { io.disconnect(); mo.disconnect(); window.clearTimeout(t); };
  }, []);

  return null;
}

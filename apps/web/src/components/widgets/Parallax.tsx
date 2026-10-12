"use client";

import { useEffect } from "react";

/**
 * انزياحٌ خفيفٌ للخلفيّة مع التمرير — عمقٌ لا لعب.
 *
 * ═══ ثلاثةُ قيودٍ تمنعه أن يصير ثِقلاً ═══
 * ١) **يتوقّف عند نهاية الواجهة الأولى.** لا يُحسب شيءٌ بعد أن تخرج من
 *    الشاشة — فالتمريرُ في بقيّة الصفحة لا يكلّف شيئاً.
 * ٢) **يُقاس في `requestAnimationFrame` لا في حدث التمرير.** حدثُ
 *    التمرير يقع عشراتِ المرّاتِ في الثانية، والقراءةُ منه مباشرةً
 *    (`getBoundingClientRect`) تُجبر المتصفّحَ على إعادة التخطيط في كلِّ
 *    مرّة — وهي أشهرُ علّةٍ تُسقط الإطارات.
 * ٣) **`transform` وحدَه يتغيّر**، فلا إعادةَ تخطيطٍ أصلاً.
 *
 * ولا يعمل على الجوّال: مساحةُ الشاشة ضيّقةٌ والأثرُ لا يُرى، وعمرُ
 * البطّاريّة أولى. ومن طلب السكون لم يُسجَّل له مستمعٌ ألبتّة.
 */
export function Parallax({ target = "[data-parallax]" }: { target?: string }) {
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia?.("(pointer: coarse)").matches) return;

    const els = Array.from(document.querySelectorAll<HTMLElement>(target));
    if (!els.length) return;

    let frame = 0;
    const apply = () => {
      frame = 0;
      const y = window.scrollY;
      for (const el of els) {
        const limit = el.offsetHeight || window.innerHeight;
        if (y > limit) continue;                       // خرجت من الشاشة — لا حساب
        const depth = Number(el.dataset.parallax || "0.18");
        el.style.transform = `translate3d(0, ${(y * depth).toFixed(1)}px, 0)`;
      }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(apply); };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
      for (const el of els) el.style.transform = "";
    };
  }, [target]);

  return null;
}

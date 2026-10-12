/**
 * شعارُ بنك وثاق — العلامةُ مأخوذةٌ من دليل البنك نفسِه
 * (غلافُ البروفايل)، لا مرسومةً تقريباً.
 *
 * ونسختان: بيضاءُ لما كان على الكحليّ، وكحليّةٌ لما كان على الأبيض —
 * فلا تذوب العلامةُ في خلفيّتها. و`dark:` لا تكفي هنا لأنّ الترويسةَ
 * الكحليّةَ تظهر في الوضعين، فالقرارُ من `light` لا من سمة النظام.
 */
export function Logo({ name, light = false }: { name: string; light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      {/* صورةٌ لا `next/image`: ملفٌّ ثابتٌ صغيرٌ في `public`، ولا حاجة
          لمعالجةٍ ولا لأحجامٍ متعدّدة — والترويسةُ أوّلُ ما يُرسم. */}
      <img
        src={light ? "/brand/mark-white.png" : "/brand/mark-navy.png"}
        alt=""
        aria-hidden="true"
        width={36}
        height={36}
        className="size-9 shrink-0 object-contain"
        decoding="async"
      />
      <span className={`text-lg font-bold ${light ? "text-white" : "text-brand-900 dark:text-white"}`}>{name}</span>
    </span>
  );
}

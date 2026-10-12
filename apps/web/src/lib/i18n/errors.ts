/**
 * Error-boundary strings — kept in a tiny module because error.tsx must be a client component
 * and shouldn't pull the whole dictionary into the browser bundle. Re-used by the dictionary.
 */
export const errorStrings = {
  ar: { title: "حدث خطأ ما", body: "نعتذر، تعذّر عرض هذه الصفحة الآن. حاول مرة أخرى، وإن تكرر الخطأ اتصل بالرقم المجاني 8008 800.", retry: "إعادة المحاولة", home: "العودة للرئيسية", ref: "رمز الخطأ" },
  en: { title: "Something went wrong", body: "Sorry, we couldn't show this page right now. Please try again — if it keeps happening, call 8008 800 toll-free.", retry: "Try again", home: "Back to home", ref: "Error code" },
};

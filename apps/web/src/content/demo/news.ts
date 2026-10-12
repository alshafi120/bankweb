import type { Localized, NewsCategory, NewsDetail } from "@/types/content";

/** Demo newsroom — fictional announcements. Content is pre-sanitised HTML, as the API would return it. */
export const demoNewsCategories: NewsCategory[] = [
  { slug: "financing", name: { ar: "التمويل", en: "Financing" } },
  { slug: "digital", name: { ar: "الخدمات الرقمية", en: "Digital" } },
  { slug: "network", name: { ar: "الانتشار", en: "Network" } },
  { slug: "csr", name: { ar: "المسؤولية المجتمعية", en: "CSR" } },
  { slug: "corporate", name: { ar: "أخبار البنك", en: "Corporate" } },
];

const cat = (slug: string): Localized => demoNewsCategories.find((c) => c.slug === slug)!.name;

const article = (
  id: string, slug: string, categorySlug: string, publishedAt: string,
  title: Localized, excerpt: Localized, paragraphs: { ar: string[]; en: string[] },
): NewsDetail => ({
  id, slug, categorySlug, publishedAt, image: "", category: cat(categorySlug), title, excerpt,
  author: "Withaq Media Office",
  content: { ar: paragraphs.ar.map((x) => `<p>${x}</p>`).join(""), en: paragraphs.en.map((x) => `<p>${x}</p>`).join("") },
  seo: { title, description: excerpt },
});

export const demoNews: NewsDetail[] = [
  article("nw1", "solar-irrigation-financing-2026", "financing", "2026-09-28",
    { ar: "إطلاق برنامج لتمويل منظومات الري بالطاقة الشمسية لصغار المزارعين", en: "New programme finances solar irrigation for smallholder farmers" },
    { ar: "يتيح البرنامج تمويلاً بآجال تصل إلى 36 شهراً مع فترة سماح تتوافق مع مواسم الحصاد.", en: "Terms up to 36 months with a grace period aligned to harvest seasons." },
    {
      ar: ["أعلن بنك وِثاق عن إطلاق برنامج جديد لتمويل منظومات الري بالطاقة الشمسية موجّه لصغار المزارعين في المحافظات الزراعية.", "ويتيح البرنامج تمويلاً بصيغة المرابحة بآجال تصل إلى 36 شهراً، مع فترة سماح تتوافق مع مواسم الحصاد، وبنسبة ربح تفضيلية.", "ويأتي البرنامج ضمن توجه البنك لدعم الأمن الغذائي وتقليل كلفة الوقود على المزارعين."],
      en: ["Withaq Bank has launched a new programme financing solar-powered irrigation for smallholder farmers in Yemen's agricultural governorates.", "The murabaha-based programme offers terms of up to 36 months, a grace period aligned with harvest seasons and a preferential profit rate.", "The programme is part of the bank's commitment to food security and to cutting farmers' fuel costs."],
    }),
  article("nw2", "app-v4-launch", "digital", "2026-09-15",
    { ar: "الإصدار الرابع من تطبيق الجوال بواجهة جديدة", en: "Version 4 of the mobile app ships with a new interface" },
    { ar: "تحويلات أسرع ودفع بالـ QR وإشعارات فورية.", en: "Faster transfers, QR payments and instant alerts." },
    {
      ar: ["أطلق البنك الإصدار الرابع من تطبيق الجوال بواجهة أعيد تصميمها بالكامل لتكون أسرع وأسهل.", "يدعم الإصدار الجديد الدفع عبر رمز QR لدى التجار، وإشعارات فورية لكل عملية، ووضعاً خاصاً بالاتصال الضعيف."],
      en: ["The bank has released version 4 of its mobile app with a fully redesigned, faster interface.", "The new version supports QR payments at merchants, instant alerts for every transaction and a low-bandwidth mode."],
    }),
  article("nw3", "seiyun-branch-opening", "network", "2026-08-30",
    { ar: "افتتاح فرع جديد في سيئون", en: "New branch opens in Seiyun" },
    { ar: "يقدّم الفرع جميع الخدمات المصرفية للأفراد والشركات.", en: "Full retail and business services." },
    {
      ar: ["افتتح البنك فرعه الجديد في مدينة سيئون بوادي حضرموت، ليرتفع عدد فروعه إلى 42 فرعاً.", "يقدّم الفرع خدمات الحسابات والتمويل والحوالات والبطاقات، ويضم صرافاً آلياً يعمل على مدار الساعة."],
      en: ["The bank opened its new branch in Seiyun, Wadi Hadramawt, bringing its network to 42 branches.", "The branch offers accounts, financing, remittances and cards, with a 24-hour ATM on site."],
    }),
  article("nw4", "financial-literacy-week", "csr", "2026-08-12",
    { ar: "أسبوع الثقافة المالية في 6 جامعات يمنية", en: "Financial literacy week across 6 Yemeni universities" },
    { ar: "ورش عن الادخار وإدارة الميزانية الشخصية.", en: "Workshops on saving and personal budgeting." },
    {
      ar: ["نظّم البنك أسبوع الثقافة المالية في ست جامعات يمنية بمشاركة أكثر من 2,000 طالب وطالبة.", "تناولت الورش الادخار وإدارة الميزانية الشخصية والحماية من الاحتيال الإلكتروني."],
      en: ["The bank ran a financial literacy week at six Yemeni universities with more than 2,000 students taking part.", "Workshops covered saving, personal budgeting and protection against online fraud."],
    }),
  article("nw5", "annual-results-2025", "corporate", "2026-07-20",
    { ar: "البنك يعلن نتائجه المالية لعام 2025", en: "Bank announces 2025 financial results" },
    { ar: "نمو في الودائع وقاعدة العملاء رغم التحديات الاقتصادية.", en: "Growth in deposits and customers despite economic headwinds." },
    {
      ar: ["أقرّت الجمعية العامة القوائم المالية لعام 2025 التي أظهرت نمواً في الودائع وقاعدة العملاء.", "ويمكن تحميل التقرير السنوي الكامل من صفحة التقارير."],
      en: ["The general assembly approved the 2025 financial statements, which show growth in deposits and customer numbers.", "The full annual report can be downloaded from the Reports page."],
    }),
  article("nw6", "agents-network-1350", "network", "2026-07-02",
    { ar: "شبكة الوكلاء تتجاوز 1,350 وكيلاً", en: "Agent network passes 1,350 agents" },
    { ar: "خدمات الحوالات وسداد الفواتير أقرب إلى القرى والأرياف.", en: "Remittances and bill payments closer to rural communities." },
    {
      ar: ["تجاوزت شبكة الوكلاء المعتمدين لدى البنك 1,350 وكيلاً في 19 مدينة ومئات القرى.", "ويستطيع العملاء إرسال واستقبال الحوالات وسداد الفواتير لدى أي وكيل معتمد."],
      en: ["The bank's network of licensed agents has passed 1,350 across 19 cities and hundreds of villages.", "Customers can send and receive remittances and pay bills at any licensed agent."],
    }),
  article("nw7", "fraud-awareness-campaign", "digital", "2026-06-18",
    { ar: "حملة توعية للحماية من الاحتيال الإلكتروني", en: "Awareness campaign against online fraud" },
    { ar: "البنك لن يطلب منك أبداً رقمك السري أو رمز التحقق.", en: "The bank will never ask for your PIN or verification code." },
    {
      ar: ["أطلق البنك حملة توعية عبر قنواته الرقمية والفروع للتعريف بأساليب الاحتيال الشائعة.", "ويذكّر البنك عملاءه بعدم مشاركة الرقم السري أو رمز التحقق مع أي جهة."],
      en: ["The bank launched an awareness campaign across its digital channels and branches about common fraud tactics.", "Customers are reminded never to share their PIN or verification code with anyone."],
    }),
  article("nw8", "sme-forum-aden", "financing", "2026-05-27",
    { ar: "منتدى تمويل المشاريع الصغيرة في عدن", en: "SME financing forum in Aden" },
    { ar: "لقاء مع أكثر من 150 رائد ورائدة أعمال.", en: "Meeting more than 150 entrepreneurs." },
    {
      ar: ["استضاف البنك منتدى تمويل المشاريع الصغيرة في عدن بمشاركة أكثر من 150 رائد ورائدة أعمال.", "واستعرض المنتدى منتجات التمويل وبرامج الإرشاد المتاحة."],
      en: ["The bank hosted an SME financing forum in Aden attended by more than 150 entrepreneurs.", "The forum presented financing products and available mentoring programmes."],
    }),
  article("nw9", "school-kits-donation", "csr", "2026-05-05",
    { ar: "توزيع 5,000 حقيبة مدرسية", en: "5,000 school kits distributed" },
    { ar: "مبادرة سنوية بالشراكة مع منظمات محلية.", en: "An annual initiative with local organisations." },
    {
      ar: ["وزّع البنك 5,000 حقيبة مدرسية على طلاب المدارس الحكومية في ست محافظات.", "وتأتي المبادرة ضمن برنامج المسؤولية المجتمعية للبنك في مجال التعليم."],
      en: ["The bank distributed 5,000 school kits to public-school pupils in six governorates.", "The initiative is part of the bank's education-focused CSR programme."],
    }),
  article("nw10", "iso-27001-certification", "corporate", "2026-04-14",
    { ar: "البنك يحصل على شهادة ISO 27001 لأمن المعلومات", en: "Bank earns ISO 27001 information-security certification" },
    { ar: "اعتراف دولي بأنظمة حماية بيانات العملاء.", en: "International recognition of how customer data is protected." },
    {
      ar: ["حصل البنك على شهادة ISO/IEC 27001 لنظام إدارة أمن المعلومات بعد تدقيق خارجي مستقل.", "وتؤكد الشهادة التزام البنك بأعلى معايير حماية بيانات العملاء."],
      en: ["The bank achieved ISO/IEC 27001 certification for its information-security management system after an independent audit.", "The certification confirms the bank's commitment to the highest standards of customer-data protection."],
    }),
];

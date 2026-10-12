import type { Locale } from "@/types/content";
import { pagesAr, pagesEn } from "./dictionary-pages";

/** Static UI strings. Editorial content comes from the CMS, not from here. */
const ar = {
  meta: { title: "بنك السلام كابيتال — عالمٌ من الخدمات المصرفيّة", description: "حساباتٌ وودائعُ وتمويلٌ إسلاميٌّ وحلولٌ رقميّةٌ وحوالاتٌ وبطاقات — من بنك السلام كابيتال للتمويل الأصغر الإسلاميّ." },
  topbar: { care: "خدمة العملاء", tollFree: "الرقم المجاني", internetBanking: "الإنترنت المصرفي" },
  nav: {
    home: "الرئيسية", about: "من نحن", personal: "الأفراد", business: "الشركات", financing: "التمويل",
    digital: "الخدمات الرقمية", cards: "البطاقات", branches: "الفروع والصرافات", news: "الأخبار", contact: "تواصل معنا",
    openAccount: "افتح حساباً", login: "تسجيل الدخول", menu: "القائمة", close: "إغلاق", switchTo: "English",
  },
  hero: {
    eyebrow: "مصرف متوافق مع أحكام الشريعة",
    title: "عالمٌ من الخدمات المصرفيّة",
    body: "لا نقدّم خدمةً مصرفيّةً واحدة، بل عالماً يجمع الحسابات والادّخار والتمويل والخدمات الرقميّة والحوالات والبطاقات وحلول الشركات في منظومةٍ واحدة.",
    primary: "افتح حسابك", secondary: "اكتشف خدماتنا",
    trust: ["مؤسّسةٌ مصرفيّةٌ يمنيّةٌ وفق أحكام الشريعة", "التزامٌ بالتعليمات الرقابيّة", "أعلى معايير الأمن السيبرانيّ"],
    phoneBalance: "الرصيد المتاح", phoneGreeting: "مساء الخير", phoneActions: ["تحويل", "فواتير", "QR", "المزيد"],
    phoneRecent: "آخر العمليات", phoneTx: [["فاتورة كهرباء", "-12,400"], ["حوالة واردة", "+85,000"], ["سوبرماركت", "-6,750"]],
  },
  services: { eyebrow: "الخدمات", title: "كل ما تحتاجه من خدمات مصرفية", more: "اكتشف المزيد" },
  needs: { eyebrow: "ابدأ من هنا", title: "ماذا تحتاج اليوم؟" },
  accounts: {
    eyebrow: "الحسابات", title: "حساب يناسب احتياجاتك", features: "المميزات", requirements: "المتطلبات",
    minimum: "الحد الأدنى للرصيد", noMinimum: "حسب نشاط المنشأة", cta: "افتح هذا الحساب",
  },
  financing: {
    eyebrow: "التمويل", title: "تمويل يدعم طموحك", body: "صيغ مرابحة ومشاركة بآجال مرنة وقرار خلال 3 أيام عمل.",
    upTo: "حتى", months: "شهراً", calc: "احسب التمويل",
  },
  calculator: {
    title: "حاسبة التمويل", note: "النتائج تقديرية بصيغة المرابحة (ربح ثابت على أصل المبلغ). العرض النهائي يحدده البنك بعد دراسة الطلب.",
    type: "نوع التمويل", amount: "مبلغ التمويل", term: "مدة التمويل", rate: "نسبة الربح السنوية",
    monthly: "القسط الشهري المتوقع", principal: "إجمالي التمويل", profit: "إجمالي الأرباح", total: "إجمالي المبلغ المستحق",
    apply: "قدّم طلب التمويل", monthsUnit: "شهر", share: "نسبة الأرباح من الإجمالي",
  },
  digital: { eyebrow: "الخدمات الرقمية", title: "مصرفك معك أينما كنت", body: "قنوات رقمية آمنة تعمل على الجوال والمتصفح، حتى مع اتصال إنترنت ضعيف." },
  cards: { eyebrow: "البطاقات", title: "بطاقاتك، عالمك", request: "اطلب البطاقة" },
  network: {
    eyebrow: "الانتشار", title: "نحن أقرب إليك", city: "المدينة", area: "المنطقة أو الحي", type: "نوع الخدمة",
    all: "الكل", allCities: "كل المدن", branch: "فرع", atm: "صراف آلي", agent: "وكيل",
    hours: "ساعات العمل", directions: "الاتجاهات", results: "نتيجة", none: "لا توجد نتائج مطابقة. جرّب مدينة أخرى أو امسح البحث.",
    mapLabel: "خريطة مواقع الفروع والصرافات والوكلاء",
  },
  news: { eyebrow: "المركز الإعلامي", title: "آخر الأخبار", readMore: "اقرأ المزيد", all: "كل الأخبار" },
  offers: { eyebrow: "العروض", title: "عروض وحملات حالية", from: "من", to: "إلى", cta: "تفاصيل العرض" },
  why: { eyebrow: "لماذا نحن؟", title: "ثقة تُبنى بالأرقام" },
  app: {
    eyebrow: "التطبيق", title: "مصرفك في هاتفك", scan: "امسح الرمز لتحميل التطبيق",
    features: ["تحويل فوري بين الحسابات وإلى البنوك الأخرى", "سداد أكثر من 40 جهة خدمية", "تجميد البطاقة وتفعيلها بلمسة", "تسجيل دخول بالبصمة"],
    googlePlay: "Google Play", appStore: "App Store", getIt: "حمّله من",
  },
  faq: { eyebrow: "الأسئلة الشائعة", title: "إجابات سريعة", more: "كل الأسئلة" },
  cta: { title: "ابدأ رحلتك المصرفية اليوم", body: "افتح حسابك عبر الموقع واستلم رقماً مرجعياً لمتابعة طلبك.", primary: "افتح حسابك", secondary: "تواصل معنا" },
  footer: {
    about: "بنك السلام كابيتال للتمويل الأصغر الإسلاميّ: مؤسّسةٌ مصرفيّةٌ يمنيّةٌ تعمل وفق أحكام ومبادئ الشريعة الإسلاميّة.",
    groups: { bank: "البنك", services: "الخدمات", help: "المساعدة" },
    links: {
      about: "عن البنك", careers: "الوظائف", news: "الأخبار", governance: "الحوكمة",
      services: "الخدمات", personal: "الأفراد", business: "الشركات", financing: "التمويل", digital: "الخدمات الرقمية",
      branches: "الفروع", contact: "تواصل معنا", complaints: "الشكاوى", privacy: "الخصوصية", terms: "الشروط والأحكام",
      board: "مجلس الإدارة", executives: "الإدارة التنفيذية", reports: "التقارير", csr: "المسؤولية المجتمعية",
      accounts: "الحسابات", cards: "البطاقات", transfers: "التحويلات", offers: "العروض",
      atms: "الصرافات الآلية", agents: "الوكلاء", faq: "الأسئلة الشائعة",
    },
    fraud: "تنبيه: لن يطلب منك البنك أبداً رقمك السري أو رمز التحقق عبر الهاتف أو الرسائل.",
    rights: "جميع الحقوق محفوظة.",
  },
  currency: "ر.ي",
  ...pagesAr,
};

export type Dictionary = typeof ar;

const en: Dictionary = {
  meta: { title: "Alsalam Capital Bank — A world of banking services", description: "Accounts, deposits, Islamic financing, digital solutions, transfers and cards — Alsalam Capital Bank for Islamic Microfinance." },
  topbar: { care: "Customer care", tollFree: "Toll-free", internetBanking: "Internet Banking" },
  nav: {
    home: "Home", about: "About", personal: "Personal", business: "Business", financing: "Financing",
    digital: "Digital", cards: "Cards", branches: "Branches & ATMs", news: "News", contact: "Contact",
    openAccount: "Open an account", login: "Log in", menu: "Menu", close: "Close", switchTo: "العربية",
  },
  hero: {
    eyebrow: "A Sharia-compliant bank",
    title: "A world of banking services",
    body: "Not one banking service, but a world of them: accounts, savings, financing, digital services, transfers, cards and corporate solutions in a single system.",
    primary: "Open your account", secondary: "Explore our services",
    trust: ["A Yemeni institution under Islamic principles", "Committed to regulatory instructions", "Highest cyber-security standards"],
    phoneBalance: "Available balance", phoneGreeting: "Good evening", phoneActions: ["Transfer", "Bills", "QR", "More"],
    phoneRecent: "Recent activity", phoneTx: [["Electricity bill", "-12,400"], ["Incoming remittance", "+85,000"], ["Supermarket", "-6,750"]],
  },
  services: { eyebrow: "Services", title: "Every banking service you need", more: "Learn more" },
  needs: { eyebrow: "Start here", title: "What do you need today?" },
  accounts: {
    eyebrow: "Accounts", title: "An account that fits your needs", features: "Features", requirements: "Requirements",
    minimum: "Minimum balance", noMinimum: "Based on business activity", cta: "Open this account",
  },
  financing: {
    eyebrow: "Financing", title: "Financing that backs your ambition", body: "Murabaha and musharaka structures, flexible terms and a decision within 3 working days.",
    upTo: "Up to", months: "months", calc: "Calculate financing",
  },
  calculator: {
    title: "Financing calculator", note: "Indicative results using murabaha (fixed profit on the principal). The final offer is set by the bank after reviewing your application.",
    type: "Financing type", amount: "Amount", term: "Term", rate: "Annual profit rate",
    monthly: "Estimated monthly instalment", principal: "Financed amount", profit: "Total profit", total: "Total payable",
    apply: "Apply for financing", monthsUnit: "mo", share: "Profit share of total",
  },
  digital: { eyebrow: "Digital banking", title: "Your bank, wherever you are", body: "Secure digital channels on mobile and web that work even on weak connections." },
  cards: { eyebrow: "Cards", title: "Your cards, your world", request: "Request card" },
  network: {
    eyebrow: "Network", title: "We're close to you", city: "City", area: "Area or district", type: "Service type",
    all: "All", allCities: "All cities", branch: "Branch", atm: "ATM", agent: "Agent",
    hours: "Opening hours", directions: "Directions", results: "results", none: "No matching locations. Try another city or clear the search.",
    mapLabel: "Map of branches, ATMs and agents",
  },
  news: { eyebrow: "Newsroom", title: "Latest news", readMore: "Read more", all: "All news" },
  offers: { eyebrow: "Offers", title: "Current offers and campaigns", from: "From", to: "to", cta: "Offer details" },
  why: { eyebrow: "Why us?", title: "Trust, measured" },
  app: {
    eyebrow: "The app", title: "Your bank in your pocket", scan: "Scan to download the app",
    features: ["Instant transfers between accounts and to other banks", "Pay 40+ billers", "Freeze and unfreeze your card in one tap", "Fingerprint login"],
    googlePlay: "Google Play", appStore: "App Store", getIt: "Get it on",
  },
  faq: { eyebrow: "FAQ", title: "Quick answers", more: "All questions" },
  cta: { title: "Start your banking journey today", body: "Open your account online and get a reference number to track your request.", primary: "Open your account", secondary: "Contact us" },
  footer: {
    about: "Alsalam Capital Bank for Islamic Microfinance is a Yemeni institution operating under Islamic principles.",
    groups: { bank: "The bank", services: "Services", help: "Help" },
    links: {
      about: "About", careers: "Careers", news: "News", governance: "Governance",
      services: "Services", personal: "Personal", business: "Business", financing: "Financing", digital: "Digital",
      branches: "Branches", contact: "Contact us", complaints: "Complaints", privacy: "Privacy", terms: "Terms & conditions",
      board: "Board of directors", executives: "Executive management", reports: "Reports", csr: "Social responsibility",
      accounts: "Accounts", cards: "Cards", transfers: "Transfers", offers: "Offers",
      atms: "ATMs", agents: "Agents", faq: "FAQ",
    },
    fraud: "Warning: the bank will never ask for your PIN or verification code by phone or message.",
    rights: "All rights reserved.",
  },
  currency: "YER",
  ...pagesEn,
};

const dictionaries: Record<Locale, Dictionary> = { ar, en };
export const getDictionary = (locale: Locale): Dictionary => dictionaries[locale];

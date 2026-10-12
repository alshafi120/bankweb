/* Copied from apps/web/src/content/demo/home.ts (fictional content) — kept untyped here and normalised in seed.ts. */

/**
 * Demo content — used when the API is unreachable (local dev, previews).
 * Fictional bank, fictional numbers and addresses. No real personal data.
 */
export const demoHome = {
  settings: {
    bankName: { ar: "بنك وِثاق", en: "Withaq Bank" },
    phone: "+967 1 400 400",
    tollFree: "8008 800",
    email: "care@withaq-bank.example",
    address: { ar: "شارع الزبيري، صنعاء، الجمهورية اليمنية", en: "Al-Zubairi St., Sana'a, Republic of Yemen" },
    internetBankingUrl: "https://ebank.withaq-bank.example",
    social: {
      facebook: "https://facebook.com/", instagram: "https://instagram.com/", x: "https://x.com/",
      linkedin: "https://linkedin.com/", youtube: "https://youtube.com/",
    },
    appStores: { googlePlay: "https://play.google.com/", appStore: "https://apps.apple.com/" },
  },

  services: [
    { id: "s1", icon: "account", href: "/accounts", title: { ar: "فتح حساب", en: "Open an account" }, summary: { ar: "افتح حسابك الجاري أو التوفير خلال دقائق، وتابع طلبك برقم مرجعي.", en: "Open a current or savings account in minutes and track it with a reference number." } },
    { id: "s2", icon: "financing", href: "/financing", title: { ar: "التمويل", en: "Financing" }, summary: { ar: "حلول تمويل متوافقة مع الشريعة للأفراد والمشاريع والشركات.", en: "Sharia-compliant financing for individuals, small businesses and companies." } },
    { id: "s3", icon: "transfer", href: "/transfers", title: { ar: "التحويلات", en: "Transfers" }, summary: { ar: "أرسل واستقبل الحوالات المحلية والدولية عبر الفروع والوكلاء والتطبيق.", en: "Send and receive local and international remittances through branches, agents and the app." } },
    { id: "s4", icon: "card", href: "/cards", title: { ar: "البطاقات", en: "Cards" }, summary: { ar: "بطاقات خصم ومسبقة الدفع وائتمانية تناسب مصاريفك اليومية وسفرك.", en: "Debit, prepaid and credit cards for everyday spending and travel." } },
    { id: "s5", icon: "payment", href: "/digital#payments", title: { ar: "الدفع الإلكتروني", en: "E-payments" }, summary: { ar: "سدّد فواتير الكهرباء والمياه والاتصالات والرسوم من مكانك.", en: "Pay electricity, water, telecom bills and fees from anywhere." } },
    { id: "s6", icon: "digital", href: "/digital", title: { ar: "الخدمات الرقمية", en: "Digital banking" }, summary: { ar: "تطبيق الجوال والخدمات المصرفية عبر الإنترنت والمحفظة الرقمية.", en: "Mobile app, internet banking and a digital wallet." } },
  ],

  needs: [
    { id: "n1", icon: "account", href: "/apply/account", label: { ar: "أريد فتح حساب", en: "Open an account" } },
    { id: "n2", icon: "financing", href: "/apply/financing", label: { ar: "أريد تمويلاً", en: "Get financing" } },
    { id: "n3", icon: "card", href: "/apply/card", label: { ar: "أريد بطاقة", en: "Get a card" } },
    { id: "n4", icon: "send", href: "/transfers#send", label: { ar: "أريد إرسال حوالة", en: "Send money" } },
    { id: "n5", icon: "receive", href: "/transfers#receive", label: { ar: "أريد استقبال حوالة", en: "Receive money" } },
    { id: "n6", icon: "branch", href: "/branches", label: { ar: "أريد معرفة أقرب فرع", en: "Find a branch" } },
  ],

  accounts: [
    {
      id: "a1", href: "/accounts/current", currency: "YER", minimumBalance: 10000,
      name: { ar: "الحساب الجاري", en: "Current account" },
      tagline: { ar: "لمعاملاتك اليومية", en: "For everyday banking" },
      features: { ar: ["دفتر شيكات", "بطاقة خصم مجانية", "تطبيق الجوال"], en: ["Cheque book", "Free debit card", "Mobile app access"] },
      requirements: { ar: ["بطاقة شخصية سارية", "صورة شخصية"], en: ["Valid national ID", "Personal photo"] },
    },
    {
      id: "a2", href: "/accounts/savings", currency: "YER", minimumBalance: 5000,
      name: { ar: "حساب التوفير", en: "Savings account" },
      tagline: { ar: "ادّخر لأهدافك", en: "Save for your goals" },
      features: { ar: ["أرباح دورية وفق المضاربة", "سحب مرن", "كشف حساب شهري"], en: ["Periodic mudaraba profit", "Flexible withdrawals", "Monthly statement"] },
      requirements: { ar: ["بطاقة شخصية سارية", "رقم هاتف"], en: ["Valid national ID", "Phone number"] },
    },
    {
      id: "a3", href: "/accounts/investment", currency: "YER", minimumBalance: 500000,
      name: { ar: "الحساب الاستثماري", en: "Investment account" },
      tagline: { ar: "ودائع لأجل بعوائد أعلى", en: "Term deposits, higher returns" },
      features: { ar: ["آجال 3 و6 و12 شهراً", "عائد متوقع أعلى", "تجديد تلقائي"], en: ["3, 6 and 12-month terms", "Higher expected return", "Auto-renewal"] },
      requirements: { ar: ["حساب جارٍ أو توفير", "بطاقة شخصية سارية"], en: ["Current or savings account", "Valid national ID"] },
    },
    {
      id: "a4", href: "/accounts/business", currency: "YER", minimumBalance: null,
      name: { ar: "حساب الشركات", en: "Business account" },
      tagline: { ar: "للمنشآت والمؤسسات", en: "For companies and institutions" },
      features: { ar: ["إدارة الرواتب", "صلاحيات متعددة للمفوضين", "خدمات تجارية"], en: ["Payroll management", "Multi-signatory access", "Trade services"] },
      requirements: { ar: ["سجل تجاري", "بطاقة ضريبية", "هويات المفوضين"], en: ["Commercial register", "Tax card", "Signatories' IDs"] },
    },
  ],

  financing: [
    { id: "f1", maxAmount: 10_000_000, maxMonths: 48, annualProfitRate: 9, name: { ar: "التمويل الشخصي", en: "Personal financing" }, summary: { ar: "مرابحة للسلع والاحتياجات الشخصية.", en: "Murabaha for personal goods and needs." } },
    { id: "f2", maxAmount: 25_000_000, maxMonths: 60, annualProfitRate: 8, name: { ar: "تمويل المشاريع الصغيرة", en: "Small business financing" }, summary: { ar: "رأس مال عامل ومعدات للمشاريع الناشئة.", en: "Working capital and equipment for growing businesses." } },
    { id: "f3", maxAmount: 150_000_000, maxMonths: 60, annualProfitRate: 7.5, name: { ar: "التمويل التجاري", en: "Commercial financing" }, summary: { ar: "تمويل البضائع والاعتمادات المستندية.", en: "Goods and letters-of-credit financing." } },
    { id: "f4", maxAmount: 500_000_000, maxMonths: 84, annualProfitRate: 7, name: { ar: "تمويل المؤسسات", en: "Corporate financing" }, summary: { ar: "تمويل المشاريع الكبيرة والتوسعات.", en: "Large projects and expansions." } },
    { id: "f5", maxAmount: 15_000_000, maxMonths: 36, annualProfitRate: 6, name: { ar: "التمويل الزراعي", en: "Agricultural financing" }, summary: { ar: "منظومات ري بالطاقة الشمسية ومدخلات زراعية.", en: "Solar irrigation systems and farm inputs." } },
    { id: "f6", maxAmount: 8_000_000, maxMonths: 36, annualProfitRate: 5.5, name: { ar: "تمويل المرأة", en: "Women entrepreneurs" }, summary: { ar: "تمويل ميسّر لمشاريع رائدات الأعمال.", en: "Preferential financing for women-led businesses." } },
  ],

  digital: [
    { id: "d1", icon: "mobile", name: { ar: "تطبيق الجوال", en: "Mobile Banking" }, summary: { ar: "رصيدك وتحويلاتك وفواتيرك في تطبيق واحد.", en: "Balance, transfers and bills in one app." } },
    { id: "d2", icon: "web", name: { ar: "الإنترنت المصرفي", en: "Internet Banking" }, summary: { ar: "إدارة حساباتك من المتصفح بأمان.", en: "Manage your accounts securely in the browser." } },
    { id: "d3", icon: "wallet", name: { ar: "المحفظة الرقمية", en: "Digital Wallet" }, summary: { ar: "ادفع واستلم الأموال برقم جوالك.", en: "Pay and get paid with your phone number." } },
    { id: "d4", icon: "qr", name: { ar: "الدفع بـ QR", en: "QR Payments" }, summary: { ar: "امسح وادفع لدى آلاف التجار.", en: "Scan and pay at thousands of merchants." } },
    { id: "d5", icon: "card", name: { ar: "البطاقات الرقمية", en: "Digital Cards" }, summary: { ar: "بطاقة افتراضية للتسوق عبر الإنترنت.", en: "A virtual card for online shopping." } },
  ],

  cards: [
    { id: "c1", tone: "jade", network: "Visa", name: { ar: "بطاقة الخصم", en: "Debit card" }, summary: { ar: "مرتبطة بحسابك مباشرة للسحب والشراء.", en: "Linked to your account for cash and purchases." } },
    { id: "c2", tone: "lapis", network: "Mastercard", name: { ar: "بطاقة مسبقة الدفع", en: "Prepaid card" }, summary: { ar: "اشحنها بالمبلغ الذي تريده وتحكّم بإنفاقك.", en: "Top up what you need and control spending." } },
    { id: "c3", tone: "saffron", network: "Visa", name: { ar: "البطاقة الائتمانية", en: "Credit card" }, summary: { ar: "سقف شهري ومزايا سفر وفق ضوابط الشريعة.", en: "Monthly limit and travel benefits, Sharia-compliant." } },
    { id: "c4", tone: "graphite", network: "Mastercard", name: { ar: "بطاقة الشركات", en: "Business card" }, summary: { ar: "إدارة مصاريف الموظفين بحدود لكل بطاقة.", en: "Employee expenses with per-card limits." } },
  ],

  stats: [
    { id: "st1", value: 42, label: { ar: "فرعاً", en: "Branches" } },
    { id: "st2", value: 118, label: { ar: "جهاز صراف آلي", en: "ATMs" } },
    { id: "st3", value: 1350, suffix: "+", label: { ar: "وكيلاً معتمداً", en: "Agents" } },
    { id: "st4", value: 19, label: { ar: "مدينة", en: "Cities" } },
  ],

  locations: [
    { id: "l1", type: "branch", lat: 15.3547, lng: 44.2066, phone: "+967 1 400 401", name: { ar: "الفرع الرئيسي", en: "Main Branch" }, city: { ar: "صنعاء", en: "Sana'a" }, district: { ar: "التحرير", en: "Al-Tahrir" }, address: { ar: "شارع الزبيري، جوار البريد", en: "Al-Zubairi St., near the post office" }, hours: { ar: "السبت–الأربعاء 8:00–14:00", en: "Sat–Wed 8:00–14:00" }, services: { ar: ["حسابات", "تمويل", "حوالات", "بطاقات"], en: ["Accounts", "Financing", "Remittances", "Cards"] } },
    { id: "l2", type: "branch", lat: 15.3289, lng: 44.1902, phone: "+967 1 400 402", name: { ar: "فرع حدة", en: "Hadda Branch" }, city: { ar: "صنعاء", en: "Sana'a" }, district: { ar: "حدة", en: "Hadda" }, address: { ar: "شارع حدة، مقابل الجامعة", en: "Hadda St., opposite the university" }, hours: { ar: "السبت–الخميس 8:00–15:00", en: "Sat–Thu 8:00–15:00" }, services: { ar: ["حسابات", "حوالات", "صراف آلي"], en: ["Accounts", "Remittances", "ATM"] } },
    { id: "l3", type: "branch", lat: 12.7855, lng: 45.0187, phone: "+967 2 400 403", name: { ar: "فرع عدن – كريتر", en: "Aden – Crater Branch" }, city: { ar: "عدن", en: "Aden" }, district: { ar: "كريتر", en: "Crater" }, address: { ar: "شارع الملكة أروى", en: "Queen Arwa St." }, hours: { ar: "السبت–الأربعاء 8:00–14:00", en: "Sat–Wed 8:00–14:00" }, services: { ar: ["حسابات", "تمويل", "حوالات"], en: ["Accounts", "Financing", "Remittances"] } },
    { id: "l4", type: "branch", lat: 13.5795, lng: 44.0209, phone: "+967 4 400 404", name: { ar: "فرع تعز", en: "Taiz Branch" }, city: { ar: "تعز", en: "Taiz" }, district: { ar: "جمال", en: "Jamal" }, address: { ar: "شارع جمال عبدالناصر", en: "Gamal Abdel Nasser St." }, hours: { ar: "السبت–الأربعاء 8:00–14:00", en: "Sat–Wed 8:00–14:00" }, services: { ar: ["حسابات", "حوالات", "بطاقات"], en: ["Accounts", "Remittances", "Cards"] } },
    { id: "l5", type: "branch", lat: 14.5426, lng: 49.1242, phone: "+967 5 400 405", name: { ar: "فرع المكلا", en: "Mukalla Branch" }, city: { ar: "المكلا", en: "Mukalla" }, district: { ar: "الشرج", en: "Al-Sharj" }, address: { ar: "الخط العام، الشرج", en: "Main road, Al-Sharj" }, hours: { ar: "السبت–الأربعاء 8:00–14:00", en: "Sat–Wed 8:00–14:00" }, services: { ar: ["حسابات", "تمويل", "حوالات"], en: ["Accounts", "Financing", "Remittances"] } },
    { id: "l6", type: "atm", lat: 15.4627, lng: 45.3220, phone: "+967 6 400 406", name: { ar: "صراف مأرب – المجمع", en: "Marib ATM – Complex" }, city: { ar: "مأرب", en: "Marib" }, district: { ar: "المجمع", en: "Al-Mujamma" }, address: { ar: "جوار المجمع الحكومي", en: "Next to the government complex" }, hours: { ar: "24 ساعة", en: "24 hours" }, services: { ar: ["سحب", "استعلام رصيد"], en: ["Cash withdrawal", "Balance enquiry"] } },
    { id: "l7", type: "agent", lat: 14.7978, lng: 42.9545, phone: "+967 3 400 407", name: { ar: "وكيل الحديدة – الميناء", en: "Hodeidah Agent – Port" }, city: { ar: "الحديدة", en: "Hodeidah" }, district: { ar: "الميناء", en: "Al-Mina" }, address: { ar: "شارع الميناء", en: "Port Street" }, hours: { ar: "يومياً 8:00–21:00", en: "Daily 8:00–21:00" }, services: { ar: ["حوالات", "سداد فواتير"], en: ["Remittances", "Bill payment"] } },
    { id: "l8", type: "atm", lat: 13.9667, lng: 44.1833, phone: "+967 4 400 408", name: { ar: "صراف إب – المدينة", en: "Ibb ATM – City" }, city: { ar: "إب", en: "Ibb" }, district: { ar: "المشنة", en: "Al-Mashannah" }, address: { ar: "الشارع العام، المشنة", en: "Main road, Al-Mashannah" }, hours: { ar: "24 ساعة", en: "24 hours" }, services: { ar: ["سحب", "إيداع"], en: ["Withdrawal", "Deposit"] } },
  ],

  news: [
    { id: "nw1", slug: "solar-irrigation-financing-2026", publishedAt: "2026-09-28", image: "/demo/news-1.webp", category: { ar: "التمويل", en: "Financing" }, title: { ar: "إطلاق برنامج لتمويل منظومات الري بالطاقة الشمسية لصغار المزارعين", en: "New programme finances solar irrigation for smallholder farmers" }, excerpt: { ar: "يتيح البرنامج تمويلاً بآجال تصل إلى 36 شهراً مع فترة سماح تتوافق مع مواسم الحصاد.", en: "Terms up to 36 months with a grace period aligned to harvest seasons." } },
    { id: "nw2", slug: "app-v4-launch", publishedAt: "2026-09-15", image: "/demo/news-2.webp", category: { ar: "الخدمات الرقمية", en: "Digital" }, title: { ar: "الإصدار الرابع من تطبيق الجوال بواجهة جديدة", en: "Version 4 of the mobile app ships with a new interface" }, excerpt: { ar: "تحويلات أسرع ودفع بالـ QR وإشعارات فورية.", en: "Faster transfers, QR payments and instant alerts." } },
    { id: "nw3", slug: "seiyun-branch-opening", publishedAt: "2026-08-30", image: "/demo/news-3.webp", category: { ar: "الانتشار", en: "Network" }, title: { ar: "افتتاح فرع جديد في سيئون", en: "New branch opens in Seiyun" }, excerpt: { ar: "يقدّم الفرع جميع الخدمات المصرفية للأفراد والشركات.", en: "Full retail and business services." } },
    { id: "nw4", slug: "financial-literacy-week", publishedAt: "2026-08-12", image: "/demo/news-4.webp", category: { ar: "المسؤولية المجتمعية", en: "CSR" }, title: { ar: "أسبوع الثقافة المالية في 6 جامعات يمنية", en: "Financial literacy week across 6 Yemeni universities" }, excerpt: { ar: "ورش عن الادخار وإدارة الميزانية الشخصية.", en: "Workshops on saving and personal budgeting." } },
  ],

  offers: [
    { id: "o1", href: "/offers/back-to-school", startsAt: "2026-09-01", endsAt: "2026-10-31", image: "/demo/offer-1.webp", title: { ar: "عرض العودة للمدارس", en: "Back to school" }, details: { ar: "تمويل الرسوم الدراسية بدون رسوم إدارية.", en: "School-fee financing with no admin fee." } },
    { id: "o2", href: "/offers/card-cashback", startsAt: "2026-10-01", endsAt: "2026-12-31", image: "/demo/offer-2.webp", title: { ar: "استرداد نقدي 5%", en: "5% cashback" }, details: { ar: "على مشتريات بطاقة الخصم لدى المتاجر المشاركة.", en: "On debit card purchases at partner stores." } },
    { id: "o3", href: "/offers/new-account", startsAt: "2026-10-01", endsAt: "2026-11-30", image: "/demo/offer-3.webp", title: { ar: "حساب جديد، بطاقة مجانية", en: "New account, free card" }, details: { ar: "إعفاء من رسوم إصدار البطاقة للسنة الأولى.", en: "First-year card fee waived." } },
  ],

  reasons: [
    { id: "r1", icon: "shield", title: { ar: "الأمان", en: "Security" }, summary: { ar: "حماية متعددة الطبقات وتحقق ثنائي لكل عملية.", en: "Layered protection and two-factor verification." } },
    { id: "r2", icon: "network", title: { ar: "الانتشار", en: "Reach" }, summary: { ar: "فروع وصرافات ووكلاء في معظم المحافظات.", en: "Branches, ATMs and agents across most governorates." } },
    { id: "r3", icon: "digital", title: { ar: "الخدمات الرقمية", en: "Digital first" }, summary: { ar: "معظم الخدمات متاحة من الجوال.", en: "Most services available on mobile." } },
    { id: "r4", icon: "speed", title: { ar: "السرعة", en: "Speed" }, summary: { ar: "رد على طلبات التمويل خلال 3 أيام عمل.", en: "Financing decisions within 3 working days." } },
    { id: "r5", icon: "eye", title: { ar: "الشفافية", en: "Transparency" }, summary: { ar: "رسوم ونسب منشورة وواضحة قبل التوقيع.", en: "Fees and rates published before you sign." } },
    { id: "r6", icon: "support", title: { ar: "خدمة العملاء", en: "Customer care" }, summary: { ar: "مركز اتصال يعمل طوال أيام الأسبوع.", en: "Contact centre open every day." } },
  ],

  reasonStats: [
    { id: "rs1", value: 420, suffix: "K+", label: { ar: "عميل", en: "Customers" } },
    { id: "rs2", value: 99.9, suffix: "%", label: { ar: "جاهزية الخدمات الرقمية", en: "Digital uptime" } },
    { id: "rs3", value: 3, label: { ar: "أيام عمل لقرار التمويل", en: "Days to financing decision" } },
    { id: "rs4", value: 24, suffix: "/7", label: { ar: "خدمة العملاء", en: "Customer care" } },
  ],

  faqs: [
    { id: "q1", question: { ar: "كيف أفتح حساباً؟", en: "How do I open an account?" }, answer: { ar: "عبّئ نموذج فتح الحساب في الموقع وستصلك رسالة برقم مرجعي، ثم زر أقرب فرع بالبطاقة الشخصية لإكمال التحقق، أو أكمله من التطبيق إن كان التحقق الرقمي متاحاً في منطقتك.", en: "Fill in the online form to get a reference number, then visit a branch with your ID to complete verification, or finish it in the app where digital verification is available." } },
    { id: "q2", question: { ar: "ما متطلبات التمويل؟", en: "What do I need for financing?" }, answer: { ar: "بطاقة شخصية سارية، ما يثبت مصدر الدخل، وحساب لدى البنك. تختلف المتطلبات الإضافية حسب نوع التمويل.", en: "A valid ID, proof of income and an account with the bank. Extra documents depend on the product." } },
    { id: "q3", question: { ar: "كيف أطلب بطاقة؟", en: "How do I request a card?" }, answer: { ar: "من صفحة البطاقات اختر البطاقة المناسبة وقدّم الطلب، وستُبلَّغ عند جاهزيتها للاستلام من الفرع.", en: "Choose a card on the Cards page and apply. We'll notify you when it's ready for pickup." } },
    { id: "q4", question: { ar: "أين أقرب فرع؟", en: "Where is my nearest branch?" }, answer: { ar: "استخدم أداة البحث في قسم «نحن أقرب إليك» واختر المدينة ونوع الخدمة.", en: "Use the finder in “We're close to you” and filter by city and service type." } },
    { id: "q5", question: { ar: "كيف أستخدم التطبيق؟", en: "How do I use the app?" }, answer: { ar: "حمّل التطبيق، سجّل برقم حسابك ورقم جوالك المسجّل، ثم فعّل رمز التحقق المرسل إليك.", en: "Download the app, register with your account and registered phone number, then enter the code we send." } },
    { id: "q6", question: { ar: "كيف أتواصل مع خدمة العملاء؟", en: "How do I contact customer care?" }, answer: { ar: "اتصل بالرقم المجاني 8008 800، أو راسلنا عبر نموذج «تواصل معنا». لن نطلب منك أبداً رقمك السري أو رمز التحقق.", en: "Call 8008 800 toll-free or use the Contact form. We will never ask for your PIN or OTP." } },
  ],
};

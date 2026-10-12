import type { AccountProduct, CardProduct, FinancingProduct, Location, Offer, Service } from "@/types/content";

/**
 * Demo catalog — fictional products, fees and locations used when the API is not configured.
 * Ids are slugs (contract: `id` = slug) so detail pages have readable URLs.
 */

export const demoServices: Service[] = [
  { id: "accounts", icon: "account", href: "/accounts", title: { ar: "فتح حساب", en: "Open an account" }, summary: { ar: "افتح حسابك الجاري أو التوفير خلال دقائق، وتابع طلبك برقم مرجعي.", en: "Open a current or savings account in minutes and track it with a reference number." } },
  { id: "financing", icon: "financing", href: "/financing", title: { ar: "التمويل", en: "Financing" }, summary: { ar: "حلول تمويل متوافقة مع الشريعة للأفراد والمشاريع والشركات.", en: "Sharia-compliant financing for individuals, small businesses and companies." } },
  { id: "transfers", icon: "transfer", href: "/transfers", title: { ar: "التحويلات", en: "Transfers" }, summary: { ar: "أرسل واستقبل الحوالات المحلية والدولية عبر الفروع والوكلاء والتطبيق.", en: "Send and receive local and international remittances through branches, agents and the app." } },
  { id: "cards", icon: "card", href: "/cards", title: { ar: "البطاقات", en: "Cards" }, summary: { ar: "بطاقات خصم ومسبقة الدفع وائتمانية تناسب مصاريفك اليومية وسفرك.", en: "Debit, prepaid and credit cards for everyday spending and travel." } },
  { id: "payments", icon: "payment", href: "/digital#payments", title: { ar: "الدفع الإلكتروني", en: "E-payments" }, summary: { ar: "سدّد فواتير الكهرباء والمياه والاتصالات والرسوم من مكانك.", en: "Pay electricity, water, telecom bills and fees from anywhere." } },
  { id: "digital", icon: "digital", href: "/digital", title: { ar: "الخدمات الرقمية", en: "Digital banking" }, summary: { ar: "تطبيق الجوال والخدمات المصرفية عبر الإنترنت والمحفظة الرقمية.", en: "Mobile app, internet banking and a digital wallet." } },
  { id: "network", icon: "branch", href: "/branches", title: { ar: "الفروع والصرافات", en: "Branches & ATMs" }, summary: { ar: "شبكة فروع وصرافات آلية ووكلاء معتمدين في معظم المحافظات.", en: "Branches, ATMs and licensed agents across most governorates." } },
  { id: "offers", icon: "wallet", href: "/offers", title: { ar: "العروض", en: "Offers" }, summary: { ar: "حملات موسمية وإعفاءات من الرسوم واسترداد نقدي.", en: "Seasonal campaigns, fee waivers and cashback." } },
  { id: "support", icon: "support", href: "/contact", title: { ar: "خدمة العملاء", en: "Customer care" }, summary: { ar: "اطلب اتصالاً من خدمة العملاء أو قدّم شكوى وتابعها برقم مرجعي.", en: "Request a callback or file a complaint and track it with a reference." } },
];

export const demoAccounts: AccountProduct[] = [
  {
    id: "current", accountType: "current", href: "/accounts/current", currency: "YER", minimumBalance: 10000,
    name: { ar: "الحساب الجاري", en: "Current account" },
    tagline: { ar: "لمعاملاتك اليومية", en: "For everyday banking" },
    features: { ar: ["دفتر شيكات", "بطاقة خصم مجانية", "تطبيق الجوال والإنترنت المصرفي", "تحويل الراتب"], en: ["Cheque book", "Free debit card", "Mobile and internet banking", "Salary transfer"] },
    requirements: { ar: ["بطاقة شخصية سارية", "صورة شخصية", "إثبات عنوان السكن"], en: ["Valid national ID", "Personal photo", "Proof of address"] },
  },
  {
    id: "savings", accountType: "savings", href: "/accounts/savings", currency: "YER", minimumBalance: 5000,
    name: { ar: "حساب التوفير", en: "Savings account" },
    tagline: { ar: "ادّخر لأهدافك", en: "Save for your goals" },
    features: { ar: ["أرباح دورية وفق المضاربة", "سحب مرن", "كشف حساب شهري", "حساب توفير للأبناء"], en: ["Periodic mudaraba profit", "Flexible withdrawals", "Monthly statement", "Children's savings option"] },
    requirements: { ar: ["بطاقة شخصية سارية", "رقم هاتف"], en: ["Valid national ID", "Phone number"] },
  },
  {
    id: "investment", accountType: "investment", href: "/accounts/investment", currency: "YER", minimumBalance: 500000,
    name: { ar: "الحساب الاستثماري", en: "Investment account" },
    tagline: { ar: "ودائع لأجل بعوائد أعلى", en: "Term deposits, higher returns" },
    features: { ar: ["آجال 3 و6 و12 شهراً", "عائد متوقع أعلى", "تجديد تلقائي", "إمكانية التمويل بضمان الوديعة"], en: ["3, 6 and 12-month terms", "Higher expected return", "Auto-renewal", "Financing secured by the deposit"] },
    requirements: { ar: ["حساب جارٍ أو توفير", "بطاقة شخصية سارية"], en: ["Current or savings account", "Valid national ID"] },
  },
  {
    id: "business", accountType: "business", href: "/accounts/business", currency: "YER", minimumBalance: null,
    name: { ar: "حساب الشركات", en: "Business account" },
    tagline: { ar: "للمنشآت والمؤسسات", en: "For companies and institutions" },
    features: { ar: ["إدارة الرواتب", "صلاحيات متعددة للمفوضين", "خدمات تجارية واعتمادات", "مدير علاقة مخصص"], en: ["Payroll management", "Multi-signatory access", "Trade services and LCs", "Dedicated relationship manager"] },
    requirements: { ar: ["سجل تجاري", "بطاقة ضريبية", "هويات المفوضين", "عقد التأسيس للشركات"], en: ["Commercial register", "Tax card", "Signatories' IDs", "Articles of association (companies)"] },
  },
];

const p = (ar: string, en: string) => ({ ar: `<p>${ar}</p>`, en: `<p>${en}</p>` });

export const demoFinancing: FinancingProduct[] = [
  {
    id: "personal", maxAmount: 10_000_000, maxMonths: 48, annualProfitRate: 9,
    name: { ar: "التمويل الشخصي", en: "Personal financing" },
    summary: { ar: "مرابحة للسلع والاحتياجات الشخصية.", en: "Murabaha for personal goods and needs." },
    body: {
      ar: "<p>يشتري البنك السلعة التي تحتاجها ثم يبيعها لك بربح معلوم مسبقاً، وتسدّد ثمنها على أقساط شهرية ثابتة.</p><ul><li>أقساط ثابتة طوال المدة</li><li>بدون غرامات تأخير ربوية</li><li>تأمين تكافلي على التمويل</li></ul>",
      en: "<p>The bank buys the goods you need and sells them to you at a profit agreed up front. You repay in fixed monthly instalments.</p><ul><li>Fixed instalments for the full term</li><li>No interest-based late fees</li><li>Takaful cover on the financing</li></ul>",
    },
    requirements: { ar: ["بطاقة شخصية سارية", "تعريف بالراتب أو ما يثبت الدخل", "حساب جارٍ لدى البنك", "عرض سعر من المورد"], en: ["Valid national ID", "Salary certificate or proof of income", "Current account with the bank", "Supplier quotation"] },
  },
  {
    id: "small-business", maxAmount: 25_000_000, maxMonths: 60, annualProfitRate: 8,
    name: { ar: "تمويل المشاريع الصغيرة", en: "Small business financing" },
    summary: { ar: "رأس مال عامل ومعدات للمشاريع الناشئة.", en: "Working capital and equipment for growing businesses." },
    body: p("تمويل للمعدات ورأس المال العامل بصيغ المرابحة والإجارة المنتهية بالتمليك، مع فترة سماح تصل إلى 3 أشهر.", "Equipment and working-capital financing through murabaha and ijara ending in ownership, with up to 3 months' grace."),
    requirements: { ar: ["سجل تجاري أو ترخيص مزاولة", "كشف حساب 6 أشهر", "دراسة جدوى مبسطة"], en: ["Commercial register or trade licence", "6-month bank statement", "Simple feasibility study"] },
  },
  {
    id: "commercial", maxAmount: 150_000_000, maxMonths: 60, annualProfitRate: 7.5,
    name: { ar: "التمويل التجاري", en: "Commercial financing" },
    summary: { ar: "تمويل البضائع والاعتمادات المستندية.", en: "Goods and letters-of-credit financing." },
    body: p("تمويل استيراد البضائع وفتح الاعتمادات المستندية وخطابات الضمان للتجار والموزعين.", "Import financing, documentary letters of credit and letters of guarantee for traders and distributors."),
    requirements: { ar: ["سجل تجاري", "بطاقة ضريبية", "قوائم مالية", "فواتير مبدئية"], en: ["Commercial register", "Tax card", "Financial statements", "Pro-forma invoices"] },
  },
  {
    id: "corporate", maxAmount: 500_000_000, maxMonths: 84, annualProfitRate: 7,
    name: { ar: "تمويل المؤسسات", en: "Corporate financing" },
    summary: { ar: "تمويل المشاريع الكبيرة والتوسعات.", en: "Large projects and expansions." },
    body: p("تمويلات مشتركة ومشاركة متناقصة للمشاريع الكبيرة في الطاقة والصناعة والبنية التحتية.", "Syndicated and diminishing-musharaka financing for large energy, industrial and infrastructure projects."),
    requirements: { ar: ["قوائم مالية مدققة لـ 3 سنوات", "دراسة جدوى", "ضمانات مقبولة"], en: ["3 years of audited financial statements", "Feasibility study", "Acceptable collateral"] },
  },
  {
    id: "agricultural", maxAmount: 15_000_000, maxMonths: 36, annualProfitRate: 6,
    name: { ar: "التمويل الزراعي", en: "Agricultural financing" },
    summary: { ar: "منظومات ري بالطاقة الشمسية ومدخلات زراعية.", en: "Solar irrigation systems and farm inputs." },
    body: p("تمويل منظومات الري بالطاقة الشمسية والبذور والأسمدة، بأقساط تتوافق مع مواسم الحصاد.", "Financing for solar irrigation, seeds and fertiliser, with instalments aligned to harvest seasons."),
    requirements: { ar: ["بطاقة شخصية", "ما يثبت حيازة الأرض أو استئجارها", "عرض سعر للمنظومة"], en: ["National ID", "Proof of land ownership or lease", "System quotation"] },
  },
  {
    id: "women", maxAmount: 8_000_000, maxMonths: 36, annualProfitRate: 5.5,
    name: { ar: "تمويل المرأة", en: "Women entrepreneurs" },
    summary: { ar: "تمويل ميسّر لمشاريع رائدات الأعمال.", en: "Preferential financing for women-led businesses." },
    body: p("نسبة ربح تفضيلية وبرنامج إرشاد مجاني لرائدات الأعمال بالشراكة مع حاضنات أعمال محلية.", "A preferential profit rate and free mentoring for women entrepreneurs, with local business incubators."),
    requirements: { ar: ["بطاقة شخصية", "وصف المشروع", "حساب لدى البنك"], en: ["National ID", "Business description", "Account with the bank"] },
  },
];

export const demoCards: CardProduct[] = [
  {
    id: "debit", tone: "jade", network: "Visa", image: "/demo/img/card_debit.jpg", name: { ar: "بطاقة الخصم", en: "Debit card" }, summary: { ar: "مرتبطة بحسابك مباشرة للسحب والشراء.", en: "Linked to your account for cash and purchases." },
    features: { ar: ["سحب مجاني من صرافات البنك", "دفع لاتلامسي", "تجميد البطاقة من التطبيق", "إشعار فوري بكل عملية"], en: ["Free withdrawals at our ATMs", "Contactless payments", "Freeze from the app", "Instant alert on every transaction"] },
    fees: { ar: "الإصدار مجاني · التجديد 3,000 ر.ي سنوياً · السحب من صرافات البنوك الأخرى 300 ر.ي", en: "Free issuance · YER 3,000 yearly renewal · YER 300 per withdrawal at other banks' ATMs" },
  },
  {
    id: "prepaid", tone: "lapis", network: "Mastercard", image: "/demo/img/card_prepaid.jpg", name: { ar: "بطاقة مسبقة الدفع", en: "Prepaid card" }, summary: { ar: "اشحنها بالمبلغ الذي تريده وتحكّم بإنفاقك.", en: "Top up what you need and control spending." },
    features: { ar: ["لا تتطلب حساباً", "مناسبة للتسوق عبر الإنترنت", "شحن من التطبيق أو الوكلاء"], en: ["No account needed", "Ideal for online shopping", "Top up via the app or agents"] },
    fees: { ar: "الإصدار 2,000 ر.ي · الشحن مجاني من التطبيق", en: "YER 2,000 issuance · free top-ups in the app" },
  },
  {
    id: "credit", tone: "saffron", network: "Visa", image: "/demo/img/card_credit.jpg", name: { ar: "البطاقة الائتمانية", en: "Credit card" }, summary: { ar: "سقف شهري ومزايا سفر وفق ضوابط الشريعة.", en: "Monthly limit and travel benefits, Sharia-compliant." },
    features: { ar: ["سقف حتى 3 أضعاف الراتب", "تأمين سفر", "دخول صالات المطارات", "قائمة برسوم شهرية ثابتة دون فوائد"], en: ["Limit up to 3× salary", "Travel insurance", "Airport lounge access", "Fixed monthly fee, no interest"] },
    fees: { ar: "رسم شهري ثابت حسب الفئة · لا فوائد على الرصيد", en: "Fixed monthly fee by tier · no interest on balance" },
  },
  {
    id: "business-card", tone: "graphite", network: "Mastercard", image: "/demo/img/card_business.jpg", name: { ar: "بطاقة الشركات", en: "Business card" }, summary: { ar: "إدارة مصاريف الموظفين بحدود لكل بطاقة.", en: "Employee expenses with per-card limits." },
    features: { ar: ["حد لكل موظف", "تقارير مصاريف شهرية", "إيقاف فوري من لوحة الشركة"], en: ["Per-employee limits", "Monthly expense reports", "Instant block from the company portal"] },
    fees: { ar: "5,000 ر.ي لكل بطاقة سنوياً", en: "YER 5,000 per card per year" },
  },
];

const loc = (
  id: string, type: Location["type"], lat: number, lng: number, phone: string,
  name: [string, string], city: [string, string], district: [string, string], address: [string, string],
  hours: [string, string], services: [string[], string[]],
): Location => ({
  id, type, lat, lng, phone,
  name: { ar: name[0], en: name[1] }, city: { ar: city[0], en: city[1] }, district: { ar: district[0], en: district[1] },
  address: { ar: address[0], en: address[1] }, hours: { ar: hours[0], en: hours[1] }, services: { ar: services[0], en: services[1] },
});

const SANAA: [string, string] = ["صنعاء", "Sana'a"];
const ADEN: [string, string] = ["عدن", "Aden"];
const TAIZ: [string, string] = ["تعز", "Taiz"];
const MUKALLA: [string, string] = ["المكلا", "Mukalla"];
const MARIB: [string, string] = ["مأرب", "Marib"];
const HODEIDAH: [string, string] = ["الحديدة", "Hodeidah"];
const IBB: [string, string] = ["إب", "Ibb"];
const SEIYUN: [string, string] = ["سيئون", "Seiyun"];
const BR_HOURS: [string, string] = ["السبت–الأربعاء 8:00–14:00", "Sat–Wed 8:00–14:00"];
const ATM_HOURS: [string, string] = ["24 ساعة", "24 hours"];
const AG_HOURS: [string, string] = ["يومياً 8:00–21:00", "Daily 8:00–21:00"];
const FULL: [string[], string[]] = [["حسابات", "تمويل", "حوالات", "بطاقات"], ["Accounts", "Financing", "Remittances", "Cards"]];
const ATM_SVC: [string[], string[]] = [["سحب", "استعلام رصيد"], ["Cash withdrawal", "Balance enquiry"]];
const ATM_DEP: [string[], string[]] = [["سحب", "إيداع"], ["Withdrawal", "Deposit"]];
const AG_SVC: [string[], string[]] = [["حوالات", "سداد فواتير"], ["Remittances", "Bill payment"]];

export const demoLocations: Location[] = [
  loc("main-branch", "branch", 15.3547, 44.2066, "+967 1 400 401", ["الفرع الرئيسي", "Main Branch"], SANAA, ["التحرير", "Al-Tahrir"], ["شارع الزبيري، جوار البريد", "Al-Zubairi St., near the post office"], BR_HOURS, FULL),
  loc("hadda-branch", "branch", 15.3289, 44.1902, "+967 1 400 402", ["فرع حدة", "Hadda Branch"], SANAA, ["حدة", "Hadda"], ["شارع حدة، مقابل الجامعة", "Hadda St., opposite the university"], ["السبت–الخميس 8:00–15:00", "Sat–Thu 8:00–15:00"], [["حسابات", "حوالات", "صراف آلي"], ["Accounts", "Remittances", "ATM"]]),
  loc("aden-crater", "branch", 12.7855, 45.0187, "+967 2 400 403", ["فرع عدن – كريتر", "Aden – Crater Branch"], ADEN, ["كريتر", "Crater"], ["شارع الملكة أروى", "Queen Arwa St."], BR_HOURS, [["حسابات", "تمويل", "حوالات"], ["Accounts", "Financing", "Remittances"]]),
  loc("aden-mansoura", "branch", 12.8640, 44.9870, "+967 2 400 413", ["فرع عدن – المنصورة", "Aden – Mansoura Branch"], ADEN, ["المنصورة", "Al-Mansoura"], ["الشارع التسعين", "Al-Tisaeen St."], BR_HOURS, FULL),
  loc("taiz-branch", "branch", 13.5795, 44.0209, "+967 4 400 404", ["فرع تعز", "Taiz Branch"], TAIZ, ["جمال", "Jamal"], ["شارع جمال عبدالناصر", "Gamal Abdel Nasser St."], BR_HOURS, [["حسابات", "حوالات", "بطاقات"], ["Accounts", "Remittances", "Cards"]]),
  loc("mukalla-branch", "branch", 14.5426, 49.1242, "+967 5 400 405", ["فرع المكلا", "Mukalla Branch"], MUKALLA, ["الشرج", "Al-Sharj"], ["الخط العام، الشرج", "Main road, Al-Sharj"], BR_HOURS, [["حسابات", "تمويل", "حوالات"], ["Accounts", "Financing", "Remittances"]]),
  loc("seiyun-branch", "branch", 15.9430, 48.7873, "+967 5 400 415", ["فرع سيئون", "Seiyun Branch"], SEIYUN, ["السحيل", "Al-Suhail"], ["شارع الجزائر", "Algeria St."], BR_HOURS, FULL),
  loc("marib-branch", "branch", 15.4700, 45.3250, "+967 6 400 416", ["فرع مأرب", "Marib Branch"], MARIB, ["المدينة", "City centre"], ["شارع الجمهورية", "Al-Jumhuriya St."], BR_HOURS, [["حسابات", "تمويل", "حوالات"], ["Accounts", "Financing", "Remittances"]]),
  loc("marib-complex-atm", "atm", 15.4627, 45.3220, "+967 6 400 406", ["صراف مأرب – المجمع", "Marib ATM – Complex"], MARIB, ["المجمع", "Al-Mujamma"], ["جوار المجمع الحكومي", "Next to the government complex"], ATM_HOURS, ATM_SVC),
  loc("ibb-city-atm", "atm", 13.9667, 44.1833, "+967 4 400 408", ["صراف إب – المدينة", "Ibb ATM – City"], IBB, ["المشنة", "Al-Mashannah"], ["الشارع العام، المشنة", "Main road, Al-Mashannah"], ATM_HOURS, ATM_DEP),
  loc("sanaa-mall-atm", "atm", 15.3120, 44.2010, "+967 1 400 409", ["صراف صنعاء – المول", "Sana'a ATM – Mall"], SANAA, ["السبعين", "Al-Sabeen"], ["المدخل الرئيسي للمول", "Mall main entrance"], ATM_HOURS, ATM_DEP),
  loc("sanaa-airport-atm", "atm", 15.4760, 44.2190, "+967 1 400 410", ["صراف المطار", "Airport ATM"], SANAA, ["بني الحارث", "Bani Al-Harith"], ["صالة الوصول", "Arrivals hall"], ATM_HOURS, ATM_SVC),
  loc("aden-port-atm", "atm", 12.7950, 44.9850, "+967 2 400 411", ["صراف عدن – المعلا", "Aden ATM – Mualla"], ADEN, ["المعلا", "Al-Mualla"], ["الشارع الرئيسي", "Main Street"], ATM_HOURS, ATM_SVC),
  loc("taiz-atm", "atm", 13.5850, 44.0150, "+967 4 400 412", ["صراف تعز – الحوبان", "Taiz ATM – Al-Hawban"], TAIZ, ["الحوبان", "Al-Hawban"], ["جولة القصر", "Al-Qasr roundabout"], ATM_HOURS, ATM_DEP),
  loc("mukalla-atm", "atm", 14.5300, 49.1300, "+967 5 400 417", ["صراف المكلا – فوّه", "Mukalla ATM – Fuwwah"], MUKALLA, ["فوّه", "Fuwwah"], ["شارع الستين", "Sixty St."], ATM_HOURS, ATM_SVC),
  loc("hodeidah-port-agent", "agent", 14.7978, 42.9545, "+967 3 400 407", ["وكيل الحديدة – الميناء", "Hodeidah Agent – Port"], HODEIDAH, ["الميناء", "Al-Mina"], ["شارع الميناء", "Port Street"], AG_HOURS, AG_SVC),
  loc("hodeidah-city-agent", "agent", 14.8020, 42.9510, "+967 3 400 418", ["وكيل الحديدة – صنعاء ستريت", "Hodeidah Agent – Sana'a St."], HODEIDAH, ["الحالي", "Al-Hali"], ["شارع صنعاء", "Sana'a Street"], AG_HOURS, AG_SVC),
  loc("ibb-agent", "agent", 13.9700, 44.1700, "+967 4 400 419", ["وكيل إب – الظهار", "Ibb Agent – Al-Dhihar"], IBB, ["الظهار", "Al-Dhihar"], ["سوق الظهار", "Al-Dhihar market"], AG_HOURS, AG_SVC),
  loc("sanaa-shumaila-agent", "agent", 15.2950, 44.1900, "+967 1 400 420", ["وكيل صنعاء – شميلة", "Sana'a Agent – Shumaila"], SANAA, ["شميلة", "Shumaila"], ["شارع تعز", "Taiz Street"], AG_HOURS, AG_SVC),
  loc("seiyun-agent", "agent", 15.9400, 48.7900, "+967 5 400 421", ["وكيل سيئون – السوق", "Seiyun Agent – Market"], SEIYUN, ["السوق", "Market"], ["سوق سيئون القديم", "Old Seiyun market"], AG_HOURS, AG_SVC),
  loc("marib-agent", "agent", 15.4550, 45.3300, "+967 6 400 422", ["وكيل مأرب – الروضة", "Marib Agent – Al-Rawdah"], MARIB, ["الروضة", "Al-Rawdah"], ["حي الروضة", "Al-Rawdah district"], AG_HOURS, AG_SVC),
];

/** Includes one expired offer to exercise the "active only" filter. */
export const demoOffers: Offer[] = [
  { id: "back-to-school", href: "/financing/personal", startsAt: "2026-09-01", endsAt: "2026-10-31", image: "", title: { ar: "عرض العودة للمدارس", en: "Back to school" }, details: { ar: "تمويل الرسوم الدراسية بدون رسوم إدارية.", en: "School-fee financing with no admin fee." } },
  { id: "card-cashback", href: "/cards/debit", startsAt: "2026-10-01", endsAt: "2026-12-31", image: "", title: { ar: "استرداد نقدي 5%", en: "5% cashback" }, details: { ar: "على مشتريات بطاقة الخصم لدى المتاجر المشاركة.", en: "On debit card purchases at partner stores." } },
  { id: "new-account", href: "/accounts/current", startsAt: "2026-10-01", endsAt: "2026-11-30", image: "", title: { ar: "حساب جديد، بطاقة مجانية", en: "New account, free card" }, details: { ar: "إعفاء من رسوم إصدار البطاقة للسنة الأولى.", en: "First-year card fee waived." } },
  { id: "solar-season", href: "/financing/agricultural", startsAt: "2026-09-15", endsAt: "2027-01-31", image: "", title: { ar: "موسم الطاقة الشمسية", en: "Solar season" }, details: { ar: "فترة سماح 6 أشهر لتمويل منظومات الري.", en: "6-month grace period on solar irrigation financing." } },
  { id: "ramadan-2026", href: "/offers", startsAt: "2026-02-15", endsAt: "2026-03-31", image: "", title: { ar: "عروض رمضان", en: "Ramadan offers" }, details: { ar: "انتهى العرض.", en: "This offer has ended." } },
];

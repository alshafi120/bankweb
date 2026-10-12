import type { CmsPage, Localized, MediaRef, PageSection } from "@/types/content";

/**
 * Demo CMS pages (GET /pages/{slug}) — fictional bank, fictional people (names and roles only, no photos).
 * Rich text is pre-sanitised HTML as the API returns it; the site still re-sanitises it (defence in depth).
 */

const L = (ar: string, en: string): Localized => ({ ar, en });
const html = (ar: string[], en: string[]): Localized => ({ ar: ar.join(""), en: en.join("") });
let seq = 0;
const s = <T extends PageSection>(section: Omit<T, "id">) => ({ ...section, id: ++seq }) as T;

const img = (id: number, file: string, ar: string, en: string): MediaRef => ({ id, url: `/demo/img/${file}.svg`, alt: L(ar, en), mime: "image/svg+xml", width: 1200, height: 800 });
const pdf = (id: number, file: string, ar: string, en: string): MediaRef => ({ id, url: `/demo/docs/${file}.pdf`, alt: L(ar, en), mime: "application/pdf" });

const seo = (title: Localized, description: Localized) => ({ title, description });
const UPDATED = "2026-09-20T09:00:00+03:00";

const page = (slug: string, title: Localized, summary: Localized, sections: PageSection[]): CmsPage =>
  ({ slug, title, summary, seo: seo(title, summary), sections, updatedAt: UPDATED });

/* ───────── About ───────── */
const about = page("about", L("من نحن", "About us"),
  L("بنك يمني متوافق مع أحكام الشريعة، يجمع بين خبرة العمل المصرفي وروح الابتكار منذ 2009.", "A Yemeni Sharia-compliant bank combining banking experience with a spirit of innovation since 2009."),
  [
    s({ type: "text", data: {
      heading: L("قصتنا", "Our story"),
      body: html(
        ["<p>تأسس بنك وِثاق عام 2009 برأس مال يمني خالص، بهدف تقديم خدمات مصرفية حديثة وموثوقة متوافقة مع أحكام الشريعة الإسلامية لكل اليمنيين، في المدن والأرياف.</p>",
         "<p>اسمنا مستلهم من <strong>الوِثاق</strong>: الرباط المتين الذي يجمع الطرفين على الثقة. وهويتنا مستلهمة من <em>القمرية</em> اليمنية التي تُدخل الضوء إلى البيت مرشّحاً وآمناً.</p>",
         "<p>اليوم نخدم أكثر من 420 ألف عميل عبر 42 فرعاً و118 صرافاً آلياً وأكثر من 1,350 وكيلاً معتمداً، إلى جانب تطبيق الجوال والإنترنت المصرفي.</p>"],
        ["<p>Withaq Bank was founded in 2009 with entirely Yemeni capital to bring modern, trustworthy, Sharia-compliant banking to every Yemeni, in cities and rural areas alike.</p>",
         "<p>Our name comes from <strong>withaq</strong> — the strong bond that holds two parties together in trust. Our identity is inspired by the Yemeni <em>qamariya</em> window, which lets light into the home, filtered and safe.</p>",
         "<p>Today we serve more than 420,000 customers through 42 branches, 118 ATMs and over 1,350 licensed agents, alongside our mobile app and internet banking.</p>"]),
    } }),
    s({ type: "statistics", data: { heading: L("وِثاق بالأرقام", "Withaq in numbers"), items: [
      { value: 2009, label: L("سنة التأسيس", "Founded") }, { value: 42, label: L("فرعاً", "Branches") },
      { value: 420, suffix: "K+", label: L("عميل", "Customers") }, { value: 19, label: L("مدينة", "Cities") },
    ] } }),
    s({ type: "features", data: { heading: L("قيمنا", "Our values"), body: L("خمس قيم توجّه كل قرار نتخذه.", "Five values guide every decision we make."), items: [
      { icon: "shield", title: L("الأمانة", "Integrity"), body: L("نحفظ أموال عملائنا وبياناتهم كما نحفظ أموالنا.", "We protect customers' money and data as we would our own.") },
      { icon: "eye", title: L("الشفافية", "Transparency"), body: L("رسوم ونسب واضحة ومنشورة قبل التوقيع.", "Clear, published fees and rates before you sign.") },
      { icon: "network", title: L("الشمول المالي", "Inclusion"), body: L("خدمات تصل إلى القرى عبر الوكلاء والجوال.", "Services that reach villages through agents and mobile.") },
      { icon: "speed", title: L("الكفاءة", "Efficiency"), body: L("قرارات سريعة وإجراءات بسيطة.", "Fast decisions and simple procedures.") },
      { icon: "support", title: L("خدمة العميل أولاً", "Customer first"), body: L("نستمع ونتعلم ونتحسن باستمرار.", "We listen, learn and keep improving.") },
    ] } }),
    s({ type: "image", data: { image: img(101, "headquarters", "المبنى الرئيسي لبنك وِثاق بواجهة مستوحاة من العمارة الصنعانية", "Withaq Bank head office with a façade inspired by Sana'ani architecture"), caption: L("المركز الرئيسي في صنعاء", "Head office, Sana'a") } }),
    s({ type: "cards", data: { heading: L("تعرّف علينا أكثر", "Learn more about us"), items: [
      { icon: "shield", title: L("مجلس الإدارة", "Board of directors"), body: L("أعضاء المجلس ولجانه.", "Board members and committees."), href: "/board" },
      { icon: "account", title: L("الإدارة التنفيذية", "Executive management"), body: L("الفريق الذي يقود العمل اليومي.", "The team leading day-to-day operations."), href: "/executive-management" },
      { icon: "eye", title: L("الحوكمة", "Governance"), body: L("السياسات والمواثيق والإفصاحات.", "Policies, charters and disclosures."), href: "/governance" },
      { icon: "payment", title: L("التقارير", "Reports"), body: L("التقارير السنوية والقوائم المالية.", "Annual reports and financial statements."), href: "/reports" },
    ] } }),
    s({ type: "video", data: { heading: L("فيلم تعريفي", "Our story on film"), url: "https://www.youtube.com/@withaq-bank-demo", poster: img(102, "film-poster", "لقطة من الفيلم التعريفي", "Still from the corporate film") } }),
    s({ type: "cta", data: { title: L("انضم إلى أكثر من 420 ألف عميل", "Join more than 420,000 customers"), body: L("افتح حسابك اليوم واستلم رقماً مرجعياً لمتابعة طلبك.", "Open your account today and get a reference number to track it."), primary: { label: L("افتح حسابك", "Open your account"), href: "/apply/account" }, secondary: { label: L("الوظائف", "Careers"), href: "/careers" } } }),
  ]);

/* ───────── Board & executives (fictional names) ───────── */
const personImg = (id: number, file: string, ar: string, en: string): MediaRef => ({
  id, url: `/demo/img/${file}.jpg`, alt: L(ar, en), mime: "image/jpeg", width: 800, height: 800
});

const person = (ar: string, en: string, roleAr: string, roleEn: string, bioAr?: string, bioEn?: string, photo?: MediaRef | null) =>
  ({ name: L(ar, en), role: L(roleAr, roleEn), bio: bioAr && bioEn ? L(bioAr, bioEn) : null, photo: photo ?? null });

const board = page("board", L("مجلس الإدارة", "Board of directors"),
  L("يضع المجلس الاستراتيجية ويشرف على إدارة المخاطر والامتثال لحماية المودعين والمساهمين.", "The board sets strategy and oversees risk and compliance to protect depositors and shareholders."),
  [
    s({ type: "people", data: { heading: L("أعضاء المجلس", "Board members"), items: [
      person("د. سالم عبدالرحمن الحكيمي", "Dr. Salem Abdulrahman Al-Hakimi", "رئيس مجلس الإدارة", "Chairman", "خبرة 30 عاماً في العمل المصرفي والاقتصاد.", "30 years in banking and economics.", personImg(601, "person_chairman", "د. سالم عبدالرحمن الحكيمي - رئيس مجلس الإدارة", "Dr. Salem Abdulrahman Al-Hakimi - Chairman")),
      person("أ. نجيب محمد العريقي", "Najib Mohammed Al-Areeqi", "نائب رئيس المجلس", "Vice Chairman", "رئيس لجنة المخاطر.", "Chair of the Risk Committee."),
      person("م. ليلى أحمد باشراحيل", "Eng. Laila Ahmed Basharahil", "عضو مستقل", "Independent member", "رئيسة لجنة التدقيق.", "Chair of the Audit Committee."),
      person("أ. عبدالله صالح الشامي", "Abdullah Saleh Al-Shami", "عضو", "Member"),
      person("د. هدى علي المقطري", "Dr. Huda Ali Al-Maqtari", "عضو مستقل", "Independent member", "رئيسة لجنة الحوكمة والترشيحات.", "Chair of the Governance & Nominations Committee."),
      person("أ. فيصل حسن بن بريك", "Faisal Hassan Bin Breik", "عضو", "Member"),
      person("أ. مروان يحيى الأهدل", "Marwan Yahya Al-Ahdal", "أمين سر المجلس", "Board Secretary"),
    ] } }),
    s({ type: "cards", data: { heading: L("لجان المجلس", "Board committees"), items: [
      { icon: "eye", title: L("لجنة التدقيق", "Audit Committee"), body: L("تشرف على التقارير المالية والتدقيق الداخلي والخارجي.", "Oversees financial reporting and internal and external audit.") },
      { icon: "shield", title: L("لجنة المخاطر", "Risk Committee"), body: L("تراجع إطار شهية المخاطر ومخاطر الائتمان والسيولة والتشغيل.", "Reviews risk appetite and credit, liquidity and operational risk.") },
      { icon: "support", title: L("لجنة الحوكمة والترشيحات", "Governance & Nominations"), body: L("تقيّم أداء المجلس وترشّح الأعضاء والقيادات.", "Evaluates board performance and nominates members and leaders.") },
      { icon: "account", title: L("اللجنة التنفيذية", "Executive Committee"), body: L("تتابع تنفيذ الاستراتيجية بين اجتماعات المجلس.", "Monitors strategy execution between board meetings.") },
    ] } }),
    s({ type: "documents", data: { heading: L("وثائق المجلس", "Board documents"), items: [
      { title: L("ميثاق مجلس الإدارة", "Board charter"), year: 2025, file: pdf(201, "board-charter-2025", "ميثاق المجلس", "Board charter") },
      { title: L("ميثاق لجنة التدقيق", "Audit Committee charter"), year: 2024, file: pdf(202, "audit-committee-charter-2024", "ميثاق لجنة التدقيق", "Audit Committee charter") },
    ] } }),
  ]);

const executives = page("executive-management", L("الإدارة التنفيذية", "Executive management"),
  L("فريق قيادي يجمع الخبرة المصرفية والتقنية لتنفيذ استراتيجية البنك.", "A leadership team combining banking and technology expertise to execute the bank's strategy."),
  [
    s({ type: "people", data: { heading: L("الفريق التنفيذي", "Executive team"), items: [
      person("أ. خالد عمر باوزير", "Khaled Omar Bawazir", "الرئيس التنفيذي", "Chief Executive Officer", "يقود البنك منذ 2019 بعد 20 عاماً في المصارف الإسلامية.", "Has led the bank since 2019 after 20 years in Islamic banking.", personImg(602, "person_ceo", "أ. خالد عمر باوزير - الرئيس التنفيذي", "Khaled Omar Bawazir - CEO")),
      person("أ. سمير ناصر القباطي", "Samir Nasser Al-Qubati", "نائب الرئيس التنفيذي للعمليات", "Deputy CEO, Operations"),
      person("أ. أمل عبدالكريم الصبري", "Amal Abdulkarim Al-Sabri", "المدير المالي", "Chief Financial Officer", undefined, undefined, personImg(603, "person_cfo", "أ. أمل عبدالكريم الصبري - المدير المالي", "Amal Abdulkarim Al-Sabri - CFO")),
      person("م. وليد سعيد العبسي", "Eng. Waleed Saeed Al-Absi", "مدير التقنية والتحول الرقمي", "Chief Technology & Digital Officer"),
      person("أ. منى حمود الوصابي", "Muna Hamoud Al-Wesabi", "مدير المخاطر", "Chief Risk Officer"),
      person("أ. ياسر عبده الشرعبي", "Yasser Abdo Al-Sharabi", "مدير الامتثال ومكافحة غسل الأموال", "Chief Compliance & AML Officer"),
      person("أ. رشا محمد الكاف", "Rasha Mohammed Al-Kaf", "مدير الخدمات المصرفية للأفراد", "Head of Retail Banking"),
      person("أ. عادل فؤاد الجنيد", "Adel Fuad Al-Junaid", "مدير الخدمات المصرفية للشركات", "Head of Corporate Banking"),
    ] } }),
    s({ type: "cta", data: { title: L("هل تريد العمل معنا؟", "Want to work with us?"), body: L("اطلع على الوظائف المتاحة في مختلف الأقسام والمدن.", "See open positions across departments and cities."), primary: { label: L("الوظائف المتاحة", "Open positions"), href: "/careers" } } }),
  ]);

/* ───────── Governance ───────── */
const governance = page("governance", L("الحوكمة", "Corporate governance"),
  L("إطار حوكمة يضمن الفصل بين الرقابة والتنفيذ ويحمي حقوق المودعين والمساهمين.", "A governance framework that separates oversight from execution and protects depositors and shareholders."),
  [
    s({ type: "text", data: { heading: L("إطار الحوكمة", "Our framework"), body: html(
      ["<p>يلتزم البنك بتعليمات البنك المركزي اليمني بشأن الحوكمة، وبالمعايير الصادرة عن هيئة المحاسبة والمراجعة للمؤسسات المالية الإسلامية (AAOIFI).</p>",
       "<ul><li>مجلس إدارة بأغلبية غير تنفيذية وثلث مستقل على الأقل.</li><li>هيئة رقابة شرعية مستقلة تجيز المنتجات وتراجع العمليات.</li><li>خطوط دفاع ثلاثة: الإدارات التشغيلية، المخاطر والامتثال، والتدقيق الداخلي.</li><li>سياسة لتعارض المصالح والإبلاغ عن المخالفات بسرية.</li></ul>"],
      ["<p>The bank follows the Central Bank of Yemen's governance instructions and the standards of the Accounting and Auditing Organization for Islamic Financial Institutions (AAOIFI).</p>",
       "<ul><li>A board with a non-executive majority and at least one-third independent members.</li><li>An independent Sharia supervisory board that approves products and reviews operations.</li><li>Three lines of defence: business units, risk and compliance, and internal audit.</li><li>Conflict-of-interest and confidential whistle-blowing policies.</li></ul>"]) } }),
    s({ type: "cards", data: { heading: L("الهيئات الرقابية", "Oversight bodies"), items: [
      { icon: "shield", title: L("هيئة الرقابة الشرعية", "Sharia Supervisory Board"), body: L("ثلاثة علماء متخصصين في فقه المعاملات.", "Three scholars specialised in Islamic commercial law.") },
      { icon: "eye", title: L("التدقيق الداخلي", "Internal Audit"), body: L("يرفع تقاريره مباشرة إلى لجنة التدقيق.", "Reports directly to the Audit Committee.") },
      { icon: "support", title: L("الامتثال", "Compliance"), body: L("مكافحة غسل الأموال وتمويل الإرهاب وحماية العملاء.", "AML/CFT and customer protection.") },
    ] } }),
    s({ type: "documents", data: { heading: L("السياسات والإفصاحات", "Policies and disclosures"), items: [
      { title: L("دليل الحوكمة المؤسسية", "Corporate governance code"), year: 2025, file: pdf(301, "governance-code-2025", "دليل الحوكمة", "Governance code") },
      { title: L("سياسة مكافحة غسل الأموال وتمويل الإرهاب", "AML/CFT policy"), year: 2025, file: pdf(302, "aml-policy-2025", "سياسة مكافحة غسل الأموال", "AML policy") },
      { title: L("سياسة تعارض المصالح", "Conflict-of-interest policy"), year: 2024, file: pdf(303, "conflict-of-interest-2024", "سياسة تعارض المصالح", "Conflict-of-interest policy") },
      { title: L("سياسة الإبلاغ عن المخالفات", "Whistle-blowing policy"), year: 2024, file: pdf(304, "whistleblowing-2024", "سياسة الإبلاغ", "Whistle-blowing policy") },
      { title: L("ميثاق السلوك المهني", "Code of conduct"), year: 2023, file: pdf(305, "code-of-conduct-2023", "ميثاق السلوك", "Code of conduct") },
    ] } }),
    s({ type: "faq", data: { heading: L("أسئلة حول الحوكمة", "Governance questions"), items: [
      { question: L("كيف أبلغ عن مخالفة؟", "How do I report misconduct?"), answer: L("عبر البريد المخصص للإبلاغ الوارد في سياسة الإبلاغ، ويُعامل البلاغ بسرية تامة.", "Use the dedicated address in the whistle-blowing policy. Reports are handled in strict confidence.") },
      { question: L("من يجيز المنتجات شرعياً؟", "Who approves products from a Sharia perspective?"), answer: L("هيئة الرقابة الشرعية المستقلة، ولا يُطرح أي منتج قبل إجازتها.", "The independent Sharia Supervisory Board. No product launches without its approval.") },
    ] } }),
  ]);

/* ───────── CSR ───────── */
const csr = page("csr", L("المسؤولية المجتمعية", "Social responsibility"),
  L("نستثمر في التعليم والشمول المالي والطاقة النظيفة لأن ازدهار مجتمعنا جزء من رسالتنا.", "We invest in education, financial inclusion and clean energy because our community's prosperity is part of our mission."),
  [
    s({ type: "statistics", data: { heading: L("أثرنا في 2025", "Our impact in 2025"), items: [
      { value: 5000, label: L("حقيبة مدرسية", "School kits") }, { value: 2000, suffix: "+", label: L("طالب في برامج الثقافة المالية", "Students in financial literacy") },
      { value: 320, label: L("منظومة ري شمسية مموّلة", "Solar irrigation systems financed") }, { value: 1.5, suffix: "%", label: L("من الأرباح للمجتمع", "Of profit to community") },
    ] } }),
    s({ type: "cards", data: { heading: L("برامجنا", "Our programmes"), items: [
      { icon: "account", title: L("الثقافة المالية", "Financial literacy"), body: L("ورش في الجامعات والمدارس عن الادخار والميزانية والحماية من الاحتيال.", "Workshops in universities and schools on saving, budgeting and fraud protection."), href: "/news/financial-literacy-week" },
      { icon: "financing", title: L("الطاقة النظيفة", "Clean energy"), body: L("تمويل ميسّر لمنظومات الري بالطاقة الشمسية.", "Preferential financing for solar irrigation."), href: "/financing/agricultural" },
      { icon: "support", title: L("التعليم", "Education"), body: L("حقائب مدرسية ومنح جامعية للطلاب المتفوقين.", "School kits and university scholarships for top students.") },
      { icon: "wallet", title: L("تمكين المرأة", "Women's empowerment"), body: L("تمويل وإرشاد لرائدات الأعمال.", "Financing and mentoring for women entrepreneurs."), href: "/financing/women" },
    ] } }),
    s({ type: "gallery", data: { heading: L("من الميدان", "From the field"), images: [
      img(401, "csr-school", "طلاب يستلمون حقائب مدرسية", "Pupils receiving school kits"),
      img(402, "csr-solar", "منظومة ري بالطاقة الشمسية في مزرعة", "A solar irrigation system on a farm"),
      img(403, "csr-workshop", "ورشة ثقافة مالية في جامعة", "A financial literacy workshop at a university"),
    ] } }),
    s({ type: "cta", data: { title: L("شريك في مبادرة مجتمعية؟", "Partnering on a community initiative?"), body: L("نرحب بالشراكات مع المنظمات المحلية.", "We welcome partnerships with local organisations."), primary: { label: L("تواصل معنا", "Contact us"), href: "/contact" } } }),
  ]);

/* ───────── Reports ───────── */
const reports = page("reports", L("التقارير", "Reports"),
  L("التقارير السنوية والقوائم المالية المدققة وتقارير الاستدامة.", "Annual reports, audited financial statements and sustainability reports."),
  [
    s({ type: "documents", data: { heading: L("التقارير السنوية", "Annual reports"), items: [2025, 2024, 2023, 2022, 2021].map((y, i) => (
      { title: L(`التقرير السنوي ${y}`, `Annual report ${y}`), year: y, file: pdf(500 + i, `annual-report-${y}`, `التقرير السنوي ${y}`, `Annual report ${y}`) })) } }),
    s({ type: "documents", data: { heading: L("القوائم المالية الربعية", "Quarterly financial statements"), items: [
      { title: L("الربع الثاني 2026", "Q2 2026"), year: 2026, file: pdf(511, "q2-2026", "القوائم الربعية", "Quarterly statements") },
      { title: L("الربع الأول 2026", "Q1 2026"), year: 2026, file: pdf(512, "q1-2026", "القوائم الربعية", "Quarterly statements") },
      { title: L("الربع الرابع 2025", "Q4 2025"), year: 2025, file: pdf(513, "q4-2025", "القوائم الربعية", "Quarterly statements") },
    ] } }),
    s({ type: "documents", data: { heading: L("الاستدامة", "Sustainability"), items: [
      { title: L("تقرير الاستدامة والمسؤولية المجتمعية", "Sustainability & CSR report"), year: 2025, file: pdf(521, "sustainability-2025", "تقرير الاستدامة", "Sustainability report") },
    ] } }),
    s({ type: "text", data: { heading: L("ملاحظة", "Note"), body: html(["<p>القوائم المالية مدققة من مراجع خارجي مستقل. للاستفسارات: <a href=\"/contact\">تواصل معنا</a>.</p>"], ["<p>Financial statements are audited by an independent external auditor. For enquiries: <a href=\"/contact\">contact us</a>.</p>"]) } }),
  ]);

/* ───────── Legal ───────── */
const privacy = page("privacy", L("سياسة الخصوصية", "Privacy policy"),
  L("كيف نجمع بياناتك الشخصية ونستخدمها ونحميها.", "How we collect, use and protect your personal data."),
  [
    s({ type: "text", data: { heading: L("البيانات التي نجمعها", "Data we collect"), body: html(
      ["<p>نجمع فقط البيانات اللازمة لتقديم الخدمة: الاسم، رقم الهوية، رقم الجوال، البريد الإلكتروني، المدينة، وبيانات الطلب نفسه. لا نستخدم ملفات تعريف الارتباط للتتبع الإعلاني.</p>"],
      ["<p>We collect only what we need to provide the service: name, ID number, mobile number, email, city and the details of your request. We do not use advertising cookies.</p>"]) } }),
    s({ type: "text", data: { heading: L("كيف نستخدمها", "How we use it"), body: html(
      ["<ul><li>معالجة طلبك والتواصل معك بشأنه.</li><li>الالتزام بمتطلبات اعرف عميلك ومكافحة غسل الأموال.</li><li>تحسين خدماتنا عبر إحصاءات زيارات مجمّعة لا تحدد هويتك.</li></ul>"],
      ["<ul><li>Processing your request and contacting you about it.</li><li>Meeting know-your-customer and AML requirements.</li><li>Improving our services with aggregated, non-identifying visit statistics.</li></ul>"]) } }),
    s({ type: "text", data: { heading: L("كيف نحميها", "How we protect it"), body: html(
      ["<p>نشفّر رقم الهوية ورقم الجوال في قواعد البيانات، ونقيّد الوصول وفق الصلاحيات، ونسجّل كل عملية اطلاع في سجل تدقيق غير قابل للتعديل. تُحذف بيانات الطلبات غير المكتملة بعد 12 شهراً.</p>"],
      ["<p>ID and mobile numbers are encrypted at rest, access is role-restricted and every access is written to an immutable audit log. Data from incomplete requests is deleted after 12 months.</p>"]) } }),
    s({ type: "text", data: { heading: L("حقوقك", "Your rights"), body: html(
      ["<p>يحق لك طلب نسخة من بياناتك أو تصحيحها أو حذفها في حدود ما يسمح به القانون. راسلنا عبر <a href=\"/contact\">صفحة التواصل</a>.</p>"],
      ["<p>You may request a copy of your data, its correction or deletion as far as the law allows. Write to us via the <a href=\"/contact\">contact page</a>.</p>"]) } }),
  ]);

const terms = page("terms", L("الشروط والأحكام", "Terms and conditions"),
  L("شروط استخدام الموقع والخدمات الإلكترونية.", "Terms for using this website and our online services."),
  [
    s({ type: "text", data: { heading: L("استخدام الموقع", "Using this website"), body: html(
      ["<p>المعلومات في هذا الموقع لأغراض تعريفية، ولا تُعد عرضاً ملزماً. تخضع جميع المنتجات لشروط العقد الموقّع وموافقة البنك.</p>"],
      ["<p>Information on this site is for general guidance and is not a binding offer. All products are subject to the signed contract and the bank's approval.</p>"]) } }),
    s({ type: "text", data: { heading: L("الطلبات الإلكترونية", "Online requests"), body: html(
      ["<p>الطلب المقدَّم عبر الموقع هو إبداء رغبة وليس عملية مالية. يستكمل البنك التحقق من الهوية قبل تنفيذ أي خدمة.</p><p>نتائج حاسبة التمويل تقديرية ولا تمثل عرضاً نهائياً.</p>"],
      ["<p>A request made through this site is an expression of interest, not a financial transaction. The bank verifies your identity before providing any service.</p><p>Financing calculator results are estimates, not a final offer.</p>"]) } }),
    s({ type: "text", data: { heading: L("الأمان", "Security"), body: html(
      ["<p>لن يطلب منك البنك أبداً الرقم السري أو رمز التحقق. تسجيل الدخول للإنترنت المصرفي يتم فقط عبر البوابة الرسمية.</p>"],
      ["<p>The bank will never ask for your PIN or verification code. Internet banking login happens only on the official portal.</p>"]) } }),
    s({ type: "text", data: { heading: L("القانون الواجب التطبيق", "Governing law"), body: html(
      ["<p>تخضع هذه الشروط لقوانين الجمهورية اليمنية وتعليمات البنك المركزي اليمني.</p>"],
      ["<p>These terms are governed by the laws of the Republic of Yemen and Central Bank of Yemen instructions.</p>"]) } }),
  ]);

/* ───────── Transfers (#send / #receive — anchors are the slug of the English heading) ───────── */
const transfers = page("transfers", L("التحويلات", "Transfers"),
  L("أرسل واستقبل الأموال داخل اليمن وخارجه عبر الفروع والوكلاء والتطبيق.", "Send and receive money in Yemen and abroad through branches, agents and the app."),
  [
    s({ type: "features", data: { heading: L("إرسال", "Send"), body: L("أرسل حوالة محلية أو دولية بخطوات بسيطة.", "Send a local or international transfer in a few simple steps."), items: [
      { icon: "mobile", title: L("من التطبيق", "From the app"), body: L("تحويل فوري بين الحسابات وإلى البنوك الأخرى على مدار الساعة.", "Instant transfers between accounts and to other banks, 24/7.") },
      { icon: "branch", title: L("من الفرع أو الوكيل", "At a branch or agent"), body: L("أحضر هويتك وبيانات المستلم ورقم جواله.", "Bring your ID and the recipient's name and mobile number.") },
      { icon: "network", title: L("حوالات دولية", "International"), body: L("عبر شبكات التحويل الدولية الشريكة إلى أكثر من 100 دولة.", "Through partner international networks to 100+ countries.") },
    ] } }),
    s({ type: "features", data: { heading: L("استقبال", "Receive"), body: L("استلم حوالتك نقداً أو مباشرة في حسابك.", "Collect your transfer in cash or straight into your account."), items: [
      { icon: "receive", title: L("إلى حسابك", "Into your account"), body: L("تُضاف الحوالة تلقائياً وتصلك رسالة فورية.", "Credited automatically with an instant alert.") },
      { icon: "wallet", title: L("نقداً", "In cash"), body: L("من أي فرع أو وكيل معتمد بالهوية ورقم الحوالة.", "At any branch or licensed agent with your ID and transfer number.") },
      { icon: "shield", title: L("بأمان", "Securely"), body: L("لا تشارك رقم الحوالة إلا مع المستفيد.", "Share the transfer number only with the beneficiary.") },
    ] } }),
    s({ type: "faq", data: { heading: L("أسئلة عن التحويلات", "Transfer questions"), items: [
      { question: L("ما رسوم التحويل المحلي؟", "What does a local transfer cost?"), answer: L("التحويل بين حسابات البنك مجاني، والرسوم الأخرى منشورة في دليل الرسوم في الفروع.", "Transfers between Withaq accounts are free; other fees are published in branches.") },
      { question: L("كم يستغرق التحويل الدولي؟", "How long do international transfers take?"), answer: L("عادة من دقائق إلى يومي عمل حسب الشبكة والدولة.", "Usually minutes to two working days depending on network and country.") },
    ] } }),
    s({ type: "map", data: { heading: L("أقرب وكيل إليك", "Find your nearest agent"), type: "agent", city: null } }),
  ]);

/* ───────── Digital ───────── */
const digital = page("digital", L("الخدمات الرقمية", "Digital banking"),
  L("تطبيق الجوال والإنترنت المصرفي والمحفظة الرقمية والدفع بالـ QR.", "Mobile app, internet banking, digital wallet and QR payments."),
  [
    s({ type: "features", data: { heading: L("قنواتنا الرقمية", "Our digital channels"), items: [
      { icon: "mobile", title: L("تطبيق الجوال", "Mobile Banking"), body: L("رصيدك وتحويلاتك وفواتيرك في تطبيق واحد، ويعمل مع اتصال ضعيف.", "Balance, transfers and bills in one app — works on weak connections.") },
      { icon: "web", title: L("الإنترنت المصرفي", "Internet Banking"), body: L("إدارة حساباتك من المتصفح بأمان مع تحقق ثنائي.", "Manage your accounts securely in the browser with two-factor verification.") },
      { icon: "wallet", title: L("المحفظة الرقمية", "Digital Wallet"), body: L("ادفع واستلم الأموال برقم جوالك.", "Pay and get paid with your phone number.") },
      { icon: "qr", title: L("الدفع بـ QR", "QR Payments"), body: L("امسح وادفع لدى آلاف التجار.", "Scan and pay at thousands of merchants.") },
      { icon: "card", title: L("البطاقات الرقمية", "Digital Cards"), body: L("بطاقة افتراضية للتسوق عبر الإنترنت.", "A virtual card for online shopping.") },
      { icon: "shield", title: L("أمان متعدد الطبقات", "Layered security"), body: L("بصمة، تحقق ثنائي، وتجميد البطاقة بلمسة.", "Biometrics, two-factor and one-tap card freeze.") },
    ] } }),
    s({ type: "cards", data: { heading: L("الدفع الإلكتروني", "Payments"), items: [
      { icon: "payment", title: L("الكهرباء والمياه", "Electricity and water"), body: L("سداد فوري للفواتير مع إيصال رقمي.", "Instant bill payment with a digital receipt.") },
      { icon: "mobile", title: L("الاتصالات والإنترنت", "Telecom and internet"), body: L("شحن الرصيد وسداد الفواتير الشهرية.", "Top-ups and monthly bills.") },
      { icon: "account", title: L("الرسوم الحكومية والجامعية", "Government and university fees"), body: L("أكثر من 40 جهة خدمية.", "More than 40 billers.") },
    ] } }),
    s({ type: "faq", data: { heading: L("أسئلة شائعة", "Common questions"), items: [
      { question: L("كيف أسجّل في التطبيق؟", "How do I register in the app?"), answer: L("حمّل التطبيق وسجّل برقم حسابك ورقم جوالك المسجّل، ثم أدخل رمز التحقق.", "Download the app, register with your account and registered mobile number, then enter the code.") },
      { question: L("هل يعمل التطبيق خارج اليمن؟", "Does the app work outside Yemen?"), answer: L("نعم، مع رقم الجوال المسجّل لاستقبال رمز التحقق.", "Yes, as long as your registered number can receive the verification code.") },
    ] } }),
    s({ type: "cta", data: { title: L("ابدأ مع الخدمات الرقمية", "Get started with digital banking"), body: L("افتح حساباً ثم فعّل التطبيق خلال دقائق.", "Open an account, then activate the app in minutes."), primary: { label: L("افتح حسابك", "Open your account"), href: "/apply/account" }, secondary: { label: L("الإنترنت المصرفي", "Internet banking"), href: "https://ebank.withaq-bank.example" } } }),
  ]);

export const demoPages: CmsPage[] = [about, board, executives, governance, csr, reports, privacy, terms, transfers, digital];
export const CMS_PAGE_SLUGS = demoPages.map((p) => p.slug);

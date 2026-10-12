import type { FaqGroup, Job } from "@/types/content";

/** Demo careers — fictional vacancies. `description` is pre-sanitised HTML. */
export const demoJobs: Job[] = [
  {
    id: "j1", slug: "customer-service-officer-sanaa", employmentType: "full_time", closesAt: "2026-11-15",
    title: { ar: "موظف خدمة عملاء", en: "Customer Service Officer" },
    department: { ar: "الخدمات المصرفية للأفراد", en: "Retail Banking" }, city: { ar: "صنعاء", en: "Sana'a" },
    summary: { ar: "استقبال العملاء وفتح الحسابات وتقديم المشورة حول منتجات البنك.", en: "Welcome customers, open accounts and advise on the bank's products." },
    description: { ar: "<p>نبحث عن موظف خدمة عملاء شغوف بخدمة الناس للانضمام إلى فريق الفرع الرئيسي.</p><ul><li>فتح الحسابات وتحديث بيانات العملاء</li><li>الرد على الاستفسارات ومتابعة الطلبات</li><li>التعريف بالخدمات الرقمية</li></ul>", en: "<p>We're looking for a people-focused customer service officer to join the Main Branch team.</p><ul><li>Open accounts and update customer records</li><li>Answer enquiries and follow up requests</li><li>Introduce customers to digital services</li></ul>" },
    requirements: { ar: ["بكالوريوس في العلوم المالية والمصرفية أو ما يعادلها", "مهارات تواصل ممتازة", "إجادة استخدام الحاسوب"], en: ["Bachelor's in banking, finance or equivalent", "Excellent communication skills", "Computer literacy"] },
  },
  {
    id: "j2", slug: "teller-aden", employmentType: "full_time", closesAt: "2026-11-01",
    title: { ar: "صرّاف", en: "Teller" },
    department: { ar: "الفروع", en: "Branches" }, city: { ar: "عدن", en: "Aden" },
    summary: { ar: "تنفيذ عمليات الإيداع والسحب والحوالات بدقة.", en: "Process deposits, withdrawals and remittances accurately." },
    description: { ar: "<p>تنفيذ العمليات النقدية اليومية وفق السياسات والإجراءات المعتمدة.</p>", en: "<p>Handle daily cash operations in line with approved policies and procedures.</p>" },
    requirements: { ar: ["دبلوم أو بكالوريوس محاسبة", "خبرة سنة في العمليات النقدية (ميزة)", "دقة وأمانة"], en: ["Diploma or bachelor's in accounting", "1 year of cash operations experience (a plus)", "Accuracy and integrity"] },
  },
  {
    id: "j3", slug: "backend-engineer", employmentType: "full_time", closesAt: "2026-12-01",
    title: { ar: "مهندس برمجيات (Backend)", en: "Backend Software Engineer" },
    department: { ar: "تقنية المعلومات", en: "Information Technology" }, city: { ar: "صنعاء", en: "Sana'a" },
    summary: { ar: "تطوير واجهات API آمنة للقنوات الرقمية.", en: "Build secure APIs for the bank's digital channels." },
    description: { ar: "<p>الانضمام إلى فريق القنوات الرقمية لتطوير خدمات PHP/Laravel آمنة وقابلة للتوسع.</p>", en: "<p>Join the digital channels team building secure, scalable PHP/Laravel services.</p>" },
    requirements: { ar: ["خبرة 3 سنوات في PHP/Laravel", "معرفة بـ MySQL وRedis", "فهم مبادئ OWASP"], en: ["3 years of PHP/Laravel", "MySQL and Redis", "Understanding of OWASP principles"] },
  },
  {
    id: "j4", slug: "credit-analyst-mukalla", employmentType: "full_time", closesAt: "2026-10-30",
    title: { ar: "محلل ائتمان", en: "Credit Analyst" },
    department: { ar: "التمويل", en: "Financing" }, city: { ar: "المكلا", en: "Mukalla" },
    summary: { ar: "دراسة طلبات التمويل وتحليل القوائم المالية.", en: "Assess financing applications and analyse financial statements." },
    requirements: { ar: ["بكالوريوس محاسبة أو تمويل", "خبرة سنتين في التحليل الائتماني"], en: ["Bachelor's in accounting or finance", "2 years of credit analysis"] },
  },
  {
    id: "j5", slug: "graduate-internship-2026", employmentType: "internship", closesAt: "2026-11-30",
    title: { ar: "برنامج تدريب الخريجين 2026", en: "Graduate Internship 2026" },
    department: { ar: "الموارد البشرية", en: "Human Resources" }, city: { ar: "تعز", en: "Taiz" },
    summary: { ar: "برنامج تدريبي مدفوع لمدة 6 أشهر لحديثي التخرج.", en: "A paid 6-month programme for recent graduates." },
    requirements: { ar: ["تخرج خلال آخر سنتين", "معدل جيد جداً فأعلى"], en: ["Graduated within the last two years", "Very good grade or higher"] },
  },
  {
    id: "j6", slug: "compliance-officer", employmentType: "contract", closesAt: "2026-11-20",
    title: { ar: "مسؤول امتثال", en: "Compliance Officer" },
    department: { ar: "الامتثال", en: "Compliance" }, city: { ar: "عدن", en: "Aden" },
    summary: { ar: "متابعة الالتزام بتعليمات البنك المركزي ومكافحة غسل الأموال.", en: "Monitor central-bank and AML/CFT compliance." },
    requirements: { ar: ["خبرة 3 سنوات في الامتثال المصرفي", "شهادة مهنية (ميزة)"], en: ["3 years of banking compliance", "Professional certification (a plus)"] },
  },
];

export const demoFaqGroups: FaqGroup[] = [
  {
    category: { slug: "accounts", name: { ar: "الحسابات", en: "Accounts" } },
    items: [
      { id: "q1", question: { ar: "كيف أفتح حساباً؟", en: "How do I open an account?" }, answer: { ar: "عبّئ نموذج فتح الحساب في الموقع وستصلك رسالة برقم مرجعي، ثم زر أقرب فرع بالبطاقة الشخصية لإكمال التحقق.", en: "Fill in the online form to get a reference number, then visit a branch with your ID to complete verification." } },
      { id: "q7", question: { ar: "هل يمكنني فتح حساب لابني القاصر؟", en: "Can I open an account for my child?" }, answer: { ar: "نعم، يمكن لولي الأمر فتح حساب توفير باسم القاصر بإحضار شهادة الميلاد وهوية ولي الأمر.", en: "Yes. A guardian can open a savings account in the child's name with the birth certificate and the guardian's ID." } },
      { id: "q8", question: { ar: "كم يستغرق تفعيل الحساب؟", en: "How long does activation take?" }, answer: { ar: "يُفعّل الحساب عادة في يوم العمل نفسه بعد استكمال التحقق في الفرع.", en: "Accounts are usually activated the same working day once verification is complete." } },
    ],
  },
  {
    category: { slug: "financing", name: { ar: "التمويل", en: "Financing" } },
    items: [
      { id: "q2", question: { ar: "ما متطلبات التمويل؟", en: "What do I need for financing?" }, answer: { ar: "بطاقة شخصية سارية، ما يثبت مصدر الدخل، وحساب لدى البنك. تختلف المتطلبات الإضافية حسب نوع التمويل.", en: "A valid ID, proof of income and an account with the bank. Extra documents depend on the product." } },
      { id: "q9", question: { ar: "متى أحصل على قرار التمويل؟", en: "When will I get a decision?" }, answer: { ar: "خلال 3 أيام عمل من استكمال المستندات.", en: "Within 3 working days of a complete application." } },
      { id: "q10", question: { ar: "هل التمويل متوافق مع الشريعة؟", en: "Is financing Sharia-compliant?" }, answer: { ar: "نعم، جميع المنتجات مجازة من هيئة الرقابة الشرعية وتعمل بصيغ المرابحة والإجارة والمشاركة.", en: "Yes. All products are approved by the Sharia board and use murabaha, ijara and musharaka." } },
    ],
  },
  {
    category: { slug: "cards", name: { ar: "البطاقات", en: "Cards" } },
    items: [
      { id: "q3", question: { ar: "كيف أطلب بطاقة؟", en: "How do I request a card?" }, answer: { ar: "من صفحة البطاقات اختر البطاقة المناسبة وقدّم الطلب، وستُبلَّغ عند جاهزيتها للاستلام من الفرع.", en: "Choose a card on the Cards page and apply. We'll notify you when it's ready for pickup." } },
      { id: "q11", question: { ar: "فقدت بطاقتي، ماذا أفعل؟", en: "I lost my card — what should I do?" }, answer: { ar: "جمّد البطاقة فوراً من التطبيق أو اتصل بالرقم المجاني 8008 800 على مدار الساعة.", en: "Freeze it in the app straight away or call 8008 800, available 24/7." } },
    ],
  },
  {
    category: { slug: "digital", name: { ar: "الخدمات الرقمية", en: "Digital banking" } },
    items: [
      { id: "q5", question: { ar: "كيف أستخدم التطبيق؟", en: "How do I use the app?" }, answer: { ar: "حمّل التطبيق، سجّل برقم حسابك ورقم جوالك المسجّل، ثم فعّل رمز التحقق المرسل إليك.", en: "Download the app, register with your account and registered phone number, then enter the code we send." } },
      { id: "q12", question: { ar: "هل التطبيق آمن؟", en: "Is the app secure?" }, answer: { ar: "نعم، يستخدم التطبيق تشفيراً كاملاً وتحققاً ثنائياً لكل عملية، ودخولاً بالبصمة.", en: "Yes. The app uses end-to-end encryption, two-factor verification on every transaction and biometric login." } },
    ],
  },
  {
    category: { slug: "support", name: { ar: "خدمة العملاء", en: "Customer care" } },
    items: [
      { id: "q4", question: { ar: "أين أقرب فرع؟", en: "Where is my nearest branch?" }, answer: { ar: "استخدم صفحة الفروع واختر المدينة ونوع الخدمة.", en: "Use the Branches page and filter by city and service type." } },
      { id: "q6", question: { ar: "كيف أتواصل مع خدمة العملاء؟", en: "How do I contact customer care?" }, answer: { ar: "اتصل بالرقم المجاني 8008 800، أو راسلنا عبر نموذج «تواصل معنا». لن نطلب منك أبداً رقمك السري أو رمز التحقق.", en: "Call 8008 800 toll-free or use the Contact form. We will never ask for your PIN or OTP." } },
      { id: "q13", question: { ar: "كم تستغرق معالجة الشكوى؟", en: "How long does a complaint take?" }, answer: { ar: "نؤكد الاستلام خلال يوم عمل واحد ونرد خلال 10 أيام عمل كحد أقصى.", en: "We acknowledge within 1 working day and respond within 10 working days at most." } },
    ],
  },
];

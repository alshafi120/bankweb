import type { HomeContent } from "@/types/content";
import { demoAccounts, demoCards, demoFinancing, demoLocations, demoOffers, demoServices } from "./catalog";
import { demoNews } from "./news";
import { activeOffers, toNewsItem } from "@/lib/content";

/**
 * Demo content — used when the API is unreachable (local dev, previews).
 * Profile data aligned with Al Salam Capital Bank for Islamic Microfinance.
 */
export const demoHome: HomeContent = {
  settings: {
    bankName: { ar: "بنك السلام كابيتال", en: "Al Salam Capital Bank" },
    phone: "+967 1 400 400",
    tollFree: "8008 800",
    email: "care@alsalam-capital.example",
    address: { ar: "شارع الزبيري، صنعاء، الجمهورية اليمنية", en: "Al-Zubairi St., Sana'a, Republic of Yemen" },
    internetBankingUrl: "https://ebank.alsalam-capital.example",
    social: {
      facebook: "https://facebook.com/", instagram: "https://instagram.com/", x: "https://x.com/",
      linkedin: "https://linkedin.com/", youtube: "https://youtube.com/",
    },
    appStores: { googlePlay: "https://play.google.com/", appStore: "https://apps.apple.com/" },
  },

  services: demoServices.slice(0, 6),

  needs: [
    { id: "n1", icon: "account", href: "/apply/account", label: { ar: "أريد فتح حساب", en: "Open an account" } },
    { id: "n2", icon: "financing", href: "/apply/financing", label: { ar: "أريد تمويلاً إسلامياً", en: "Islamic financing" } },
    { id: "n3", icon: "card", href: "/apply/card", label: { ar: "أريد بطاقة مصرفية", en: "Get a bank card" } },
    { id: "n4", icon: "send", href: "/transfers#send", label: { ar: "إرسال حوالة (سلام كاش)", en: "Send via Salam Cash" } },
    { id: "n5", icon: "receive", href: "/transfers#receive", label: { ar: "استقبال حوالة", en: "Receive money" } },
    { id: "n6", icon: "branch", href: "/branches", label: { ar: "أقرب فرع وصراف آلي", en: "Branches & ATMs" } },
  ],

  accounts: demoAccounts,

  financing: demoFinancing,

  digital: [
    { id: "d1", icon: "mobile", name: { ar: "السلام موبايلي", en: "Salam Mobile" }, summary: { ar: "تطبيقك المصرفي الذكي لإدارة الحسابات والتحويلات.", en: "Your smart banking app for accounts and transfers." } },
    { id: "d2", icon: "wallet", name: { ar: "سلام Wallet", en: "Salam Wallet" }, summary: { ar: "محفظتك الرقمية الذكية تعمل أونلاين وأوفلاين.", en: "Smart digital wallet working online and offline." } },
    { id: "d3", icon: "transfer", name: { ar: "سلام كاش", en: "Salam Cash" }, summary: { ar: "شبكة الحوالات المحلية والشبكة الموحدة UNMoney.", en: "Local transfer network & UNMoney integration." } },
    { id: "d4", icon: "qr", name: { ar: "سلام باي", en: "Salam Pay" }, summary: { ar: "مدفوعات ذكية تعتمد على رمز الاستجابة السريع QR.", en: "Smart QR code payments for merchants and users." } },
    { id: "d5", icon: "payment", name: { ar: "سلام سداد", en: "Salam Sadad" }, summary: { ar: "سداد فواتير الاتصالات والإنترنت والكهرباء والمياه.", en: "Instant bill payment for telecom, power & water." } },
    { id: "d6", icon: "digital", name: { ar: "سلام موني", en: "Salam Money" }, summary: { ar: "سحب نقدي من أجهزة الصراف الآلي بدون بطاقة.", en: "Cardless cash withdrawal from ATMs." } },
  ],

  cards: demoCards,

  stats: [
    { id: "st1", value: 42, label: { ar: "فرعاً ومكتباً", en: "Branches & offices" } },
    { id: "st2", value: 118, label: { ar: "جهاز صراف آلي ATM", en: "ATMs" } },
    { id: "st3", value: 1350, suffix: "+", label: { ar: "وكيلاً معتمداً", en: "Licensed agents" } },
    { id: "st4", value: 19, label: { ar: "محافظة ومدينة", en: "Governorates" } },
  ],

  locations: demoLocations,

  // Latest 4 published items (lead + 3) and active offers only
  news: demoNews.slice(0, 4).map(toNewsItem),

  offers: activeOffers(demoOffers).slice(0, 3),

  reasons: [
    { id: "r1", icon: "shield", title: { ar: "شرعية إسلامية", en: "Sharia Compliant" }, summary: { ar: "جميع الخدمات والتمويلات متوافقة مع أحكام الشريعة الإسلامية.", en: "All products and financing comply with Islamic Sharia principles." } },
    { id: "r2", icon: "digital", title: { ar: "منظومة رقمية متطورة", en: "Advanced Digital Ecosystem" }, summary: { ar: "تطبيق ذكي، محفظة رقمية، ودفع إلكتروني على مدار 24/7.", en: "Smart mobile app, digital wallet & e-payments 24/7." } },
    { id: "r3", icon: "network", title: { ar: "انتشار واسع وشبكة وكلاء", en: "Wide Reach & Agents Network" }, summary: { ar: "فروع، صرافات، وشبكة وكلاء متنامية في جميع المحافظات.", en: "Branches, ATMs and growing agent network across Yemen." } },
    { id: "r4", icon: "speed", title: { ar: "سرعة الإنجاز والخدمة", en: "Fast & Reliable Execution" }, summary: { ar: "سرعة وسهولة في تنفيذ المعاملات وإنجاز طلبي التمويل.", en: "Swift transaction processing and financing approvals." } },
    { id: "r5", icon: "eye", title: { ar: "الحوكمة والشفافية", en: "Governance & Transparency" }, summary: { ar: "التزام راسخ بالتعليمات الرقابية والشفافية التامة.", en: "Firm commitment to governance standards and full transparency." } },
    { id: "r6", icon: "support", title: { ar: "الأمن السيبراني وحماية البيانات", en: "Cyber Security & Safety" }, summary: { ar: "أعلى معايير الحماية والأمان لحساباتك ومعلوماتك.", en: "Highest cyber security standards protecting your data." } },
  ],

  reasonStats: [
    { id: "rs1", value: 420, suffix: "K+", label: { ar: "عميل يثق بنا", en: "Satisfied Customers" } },
    { id: "rs2", value: 99.9, suffix: "%", label: { ar: "جاهزية المنظومة الرقمية", en: "Digital Uptime" } },
    { id: "rs3", value: 3, label: { ar: "أيام لقرار التمويل", en: "Days to Financing Approval" } },
    { id: "rs4", value: 24, suffix: "/7", label: { ar: "دعم وخدمة العملاء", en: "Customer Support" } },
  ],

  faqs: [
    { id: "q1", question: { ar: "ما الذي يميز بنك السلام كابيتال؟", en: "What makes Al Salam Capital Bank unique?" }, answer: { ar: "نقدم عالماً متكاملاً من الخدمات المصرفية والحلول الرقمية (السلام موبايلي، سلام Wallet، سلام كاش، سلام باي) التي تجمع بين مبادئ الصيرفة الإسلامية وأحدث التقنيات المالية تحت سقف واحد.", en: "We offer a complete world of banking services and digital solutions (Salam Mobile, Salam Wallet, Salam Cash, Salam Pay) combining Islamic banking principles with modern technology." } },
    { id: "q2", question: { ar: "ما الفرق بين السلام موبايلي وسلام Wallet؟", en: "What is the difference between Salam Mobile and Salam Wallet?" }, answer: { ar: "السلام موبايلي مخصص لعملاء البنك أصحاب الحسابات لإدارة كافة معاملاتهم وحساباتهم، بينما سلام Wallet محفظة رقمية ذكية تناسب جميع أفراد المجتمع لتنفيذ الخدمات اليومية بسرعة بدون الحاجة لحساب مصرفي تقليدي وتعمل أونلاين وأوفلاين.", en: "Salam Mobile is for bank account holders to manage full banking services, while Salam Wallet is a quick digital wallet for everyone to perform daily payments online & offline without a traditional account." } },
    { id: "q3", question: { ar: "كيف تعمل خدمة سلام كاش والحوالات؟", en: "How does Salam Cash remittance network work?" }, answer: { ar: "سلام كاش هي شبكة الحوالات المحلية التابعة للبنك والتي تتكامل مع التطبيق الذكي والشبكة الموحدة UNMoney لإرسال واستقبال الأموال بسرعة وأمان عبر الفروع والوكلاء المعتمدين.", en: "Salam Cash is the bank's local remittance network integrated with mobile banking and the UNMoney national network for instant local transfers." } },
    { id: "q4", question: { ar: "كيف أستفيد من خدمات الدفع سلام باي وسلام سداد؟", en: "How do I use Salam Pay and Salam Sadad?" }, answer: { ar: "تتيح لك خدمة سلام باي الدفع السريع لدى المتاجر والشركاء باستخدام رمز الاستجابة السريع QR، بينما تتيح خدمة سلام سداد دفع فواتير الاتصالات والإنترنت والكهرباء والمياه والرسوم الحكومية فورياً من التطبيق.", en: "Salam Pay allows instant merchant payments via QR code, while Salam Sadad handles instant bill payments for telecom, internet, power, water and fees directly from the app." } },
  ],
};

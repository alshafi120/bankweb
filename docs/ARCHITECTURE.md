# منصة بنك وِثاق — المعمارية (Architecture)

> اسم البنك "وِثاق" (Withaq Bank) اسم افتراضي أصلي للمشروع، يُستبدل باسم البنك الفعلي من لوحة التحكم (Settings → Brand).

## 1. نظرة عامة

```
                    ┌─────────────── Cloudflare (WAF · CDN · DDoS · TLS) ───────────────┐
                    │                                                                    │
           www.bank.ye                                                   admin.bank.ye (IP allow-list + Zero Trust)
                    │                                                                    │
           ┌────────▼────────┐                                            ┌──────────────▼─────────────┐
           │  apps/web       │  Next.js 15 (SSR/ISR)                      │  apps/admin                │  Next.js 15 (CSR + SSR shell)
           │  Public Website │  لا أسرار في الواجهة                       │  Admin Dashboard / CMS     │  جلسة Sanctum (cookie, SameSite=strict)
           └────────┬────────┘                                            └──────────────┬─────────────┘
                    │  GET /api/v1/* (public, cached)                                     │ /api/admin/v1/* (auth + RBAC + audit)
                    └──────────────────────────────┬──────────────────────────────────────┘
                                          ┌────────▼─────────┐
                                          │  Nginx           │  rate limit · security headers · gzip/brotli
                                          └────────┬─────────┘
                                          ┌────────▼─────────┐
                                          │  apps/api        │  Laravel 12 — Modular Monolith (Clean Architecture)
                                          │  REST API        │  Sanctum · Policies · FormRequests · Queues
                                          └──┬──────┬──────┬─┘
                                   MySQL 8 ◄─┘      │      └─► S3-compatible storage (media, signed URLs, AV scan)
                                   Redis (cache · sessions · queues · rate limits)
                                                    │
                                          ┌─────────▼──────────┐
                                          │ Integration Layer  │  (مرحلة لاحقة) خدمة منفصلة + mTLS + قائمة عناوين
                                          │ Adapters/Outbox    │  Core Banking · Wallet · Remittance · CRM · KYC · SMS · Email
                                          └────────────────────┘
```

### مبدأ الفصل المصرفي (غير قابل للتفاوض)

- الموقع ولوحة التحكم **لا يتصلان أبداً** بقاعدة بيانات Core Banking.
- الإصدار الأول يدير **المحتوى والطلبات العامة فقط** (طلب فتح حساب، طلب تمويل، طلب بطاقة، شكوى…) — الطلب "نية" وليس عملية مالية.
- أي تكامل مستقبلي يمر عبر `Integration Layer` منفصلة بعقود (Contracts/Ports) داخل الـ API، وتنفيذ فعلي (Adapters) في خدمة مستقلة، مع نمط **Outbox** لضمان عدم الضياع وعدم الازدواج.
- "تسجيل الدخول" في الموقع العام = رابط خارجي إلى بوابة Internet Banking الرسمية، وليس نظام دخول داخل الموقع.

## 2. Monorepo — هيكل المجلدات

```
withaq-bank/
├── apps/
│   ├── web/                      # الموقع العام — Next.js + TS + Tailwind
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── [locale]/              # ar | en — كل صفحة تُولَّد باللغتين
│   │   │   │   │   ├── layout.tsx         # dir=rtl/ltr + خطوط + Header/Footer
│   │   │   │   │   ├── page.tsx           # الصفحة الرئيسية
│   │   │   │   │   ├── about/ board/ executive-management/ governance/ csr/ reports/
│   │   │   │   │   ├── accounts/ services/ financing/ cards/ digital/ transfers/
│   │   │   │   │   ├── branches/ atms/ agents/ news/[slug]/ offers/ faq/ careers/
│   │   │   │   │   ├── contact/ complaints/ privacy/ terms/
│   │   │   │   │   └── apply/[form]/      # account | financing | card | callback | job
│   │   │   │   ├── sitemap.ts · robots.ts # ديناميكية من الـ API
│   │   │   │   └── globals.css            # Design tokens (CSS variables)
│   │   │   ├── components/
│   │   │   │   ├── ui/                    # Button, Card, Badge, Input, Select, Accordion, Toast, Modal, Skeleton…
│   │   │   │   ├── layout/                # TopBar, Header, MobileNav, Footer, LocaleSwitcher
│   │   │   │   ├── sections/              # Hero, Services, Needs, Accounts, Financing, Digital, Cards… (= كتل Page Builder)
│   │   │   │   └── widgets/               # FinancingCalculator, BranchFinder, Counter, PhoneMockup, BankCard
│   │   │   ├── lib/
│   │   │   │   ├── api/                   # عميل API مُنمَّط + fallback للبيانات التجريبية
│   │   │   │   ├── i18n/                  # القواميس + أدوات الاتجاه والأرقام والعملة
│   │   │   │   ├── finance.ts             # منطق الحاسبة (دالة نقية مختبرة)
│   │   │   │   └── seo.ts                 # Metadata · OG · JSON-LD (BankOrCreditUnion, FAQPage, BreadcrumbList)
│   │   │   ├── content/demo/              # بيانات تجريبية (بدون بيانات شخصية حقيقية)
│   │   │   ├── types/                     # عقود البيانات المشتركة مع الـ API
│   │   │   └── middleware.ts              # توجيه اللغة + CSP nonce
│   │   └── next.config.ts                 # Security headers · images (AVIF/WebP)
│   │
│   ├── admin/                    # لوحة التحكم — Next.js (مرحلة 3)
│   │   └── src/{app/(auth),app/(dashboard)/[module],components/{data-table,forms,page-builder,media},lib/{rbac,api}}
│   │
│   └── api/                      # Laravel 12 (مرحلة 4)
│       ├── app/
│       │   ├── Modules/                   # Modular monolith — وحدة لكل مجال
│       │   │   ├── Identity/              # Users, Roles, Permissions, 2FA, Sessions
│       │   │   ├── Content/               # Pages, PageSections, Menus, Banners, FAQs, Settings, SEO
│       │   │   ├── Catalog/               # Services, Products, FinancingProducts, Cards, Offers
│       │   │   ├── News/                  # News, Categories, Workflow (Draft→Review→Approved→Published/Scheduled)
│       │   │   ├── Network/               # Branches, ATMs, Agents, Cities
│       │   │   ├── Applications/          # Account/Financing/Card/Contact/Complaints/JobApplications
│       │   │   ├── Careers/               # Jobs
│       │   │   ├── Media/                 # Upload, AV scan, variants, signed URLs
│       │   │   ├── Audit/                 # audit_logs (immutable), activity_logs
│       │   │   └── Integration/           # Ports فقط في v1 (CoreBankingPort, SmsPort…)
│       │   │       كل وحدة:  Domain/ (Entities, Enums, Events)
│       │   │                 Application/ (Actions/UseCases, DTOs)
│       │   │                 Infrastructure/ (Eloquent Models, Repositories)
│       │   │                 Http/ (Controllers, Requests, Resources, Policies)
│       │   └── Support/                   # Translatable trait, HasStatus, HasSeo, Sluggable
│       ├── routes/api_v1.php · routes/admin_v1.php
│       ├── database/{migrations,seeders/Demo*}
│       └── tests/{Feature,Unit}
│
├── packages/
│   ├── design-tokens/            # مصدر واحد للألوان والخطوط → CSS vars + Tailwind preset للتطبيقين
│   └── api-types/                # أنواع TS مُولّدة من OpenAPI
├── infra/
│   ├── nginx/                    # vhosts + security headers + rate limits
│   ├── docker/                   # docker-compose للتطوير (mysql, redis, minio, mailpit)
│   └── ci/                       # lint · typecheck · test · lighthouse-ci · composer audit · npm audit
└── docs/
    ├── ARCHITECTURE.md · DESIGN-SYSTEM.md · SECURITY.md · API.md (OpenAPI) · DATABASE.md
```

## 3. القرارات الرئيسية

| القرار | الخيار | السبب |
|---|---|---|
| تقسيم التطبيقات | `web` و`admin` منفصلان | نطاق مستقل للإدارة يمكن حجبه بالـ IP وZero Trust، وحزمة الموقع العام لا تحمل كود الإدارة |
| Backend | Modular Monolith في Laravel | فريق واحد، نشر بسيط، مع حدود وحدات واضحة قابلة للفصل لاحقاً |
| التعدد اللغوي للمحتوى | أعمدة `*_ar` / `*_en` للحقول الأساسية + جدول `translations` للحقول المرنة | استعلامات سريعة وفهرسة بحث، ولا يُنشر محتوى بلغة ناقصة (تحقق عند النشر) |
| Page Builder | `page_sections` بنوع + `data` JSON مُتحقَّق بمخطط لكل نوع | كل نوع كتلة يقابله مكوّن React واحد في `components/sections` |
| العرض | ISR مع إعادة توليد عند النشر (webhook من الـ API) | سرعة صفحات ثابتة مع تحديث فوري بعد النشر |
| النماذج العامة | API → `applications` + رقم مرجعي + Queue للإشعارات | لا يُرسل أي شيء متزامن إلى أنظمة البنك |
| مكافحة الإزعاج | Cloudflare Turnstile + honeypot + rate limit لكل IP/نموذج | بلا CAPTCHA مزعج للمستخدم |

## 4. الأمان (ملخص — التفصيل في SECURITY.md)

- **Edge:** Cloudflare WAF (OWASP ruleset)، HSTS preload، TLS 1.2+، Bot management.
- **Headers:** CSP بـ nonce، `X-Frame-Options: DENY`، `Referrer-Policy: strict-origin-when-cross-origin`، `Permissions-Policy` مغلقة، `X-Content-Type-Options: nosniff`.
- **Admin Auth:** Sanctum SPA cookies (`Secure; HttpOnly; SameSite=Strict`)، CSRF، Argon2id، 2FA إلزامي (TOTP) للأدوار الإدارية، قفل بعد 5 محاولات، تجديد الجلسة عند الدخول، مهلة خمول 15 دقيقة، إدارة الجلسات النشطة وإنهاؤها.
- **Authorization:** RBAC (roles ↔ permissions) + Policies لكل مورد، وصلاحية النشر منفصلة عن التحرير (فصل المهام Maker/Checker).
- **الإدخال/الإخراج:** FormRequest لكل endpoint، Eloquent/Query Builder فقط (لا SQL خام)، تنقية HTML للمحتوى الغني (allow-list)، ترميز الإخراج في React افتراضياً.
- **الرفع:** تحقق من MIME الحقيقي والامتداد والحجم، فحص فيروسات، إعادة ترميز الصور، تخزين خارج الـ webroot، روابط موقّعة للمستندات الخاصة (السير الذاتية، مرفقات الشكاوى).
- **البيانات الشخصية:** تشفير الحقول الحساسة (رقم الهوية، الهاتف) على مستوى التطبيق، سياسة احتفاظ وحذف، إخفاء جزئي في الواجهات.
- **Audit:** سجل غير قابل للتعديل (append-only) لكل عملية مهمة مع المستخدم، العملية، المورد، القيم قبل/بعد، IP، User-Agent، الوقت.
- **الأسرار:** في متغيرات البيئة/Secrets Manager فقط؛ لا مفاتيح في الواجهة.

## 5. الأداء

SSR/ISR، `next/image` (AVIF/WebP)، Code splitting للودجات التفاعلية (الحاسبة، الخريطة)، خطوط ذاتية الاستضافة عبر `next/font`، Redis cache لاستجابات الـ API العامة مع إبطال عند النشر، CDN، Brotli. الهدف Lighthouse ≥ 90 في الأربع فئات.

## 6. خارطة التنفيذ

| المرحلة | المحتوى | الحالة |
|---|---|---|
| 1 | المعمارية + Design System + الصفحة الرئيسية (عربي/إنجليزي) | ✅ |
| 2 | باقي صفحات الموقع + النماذج الست | ✅ |
| 3 | لوحة التحكم: Auth/2FA، Dashboard، CMS، Page Builder، Media، RBAC، Audit | ✅ |
| 4 | Laravel API + قاعدة البيانات + Seeders تجريبية + OpenAPI | ✅ |
| 5 | SEO، الاختبارات، CI، Nginx/Docker، توثيق الأمان | ✅ |

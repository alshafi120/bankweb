# عقد الـ API — Withaq Bank

الأنواع الدقيقة لكل طلب/استجابة في `packages/api-types/src/index.ts` (المصدر الوحيد للحقيقة).
هذا الملف يحدد المسارات والسلوك.

## اتفاقيات عامة

- مفاتيح JSON بصيغة **camelCase** في الطلبات والاستجابات (Laravel يحوّلها إلى snake_case داخلياً).
- الحقول النصية ثنائية اللغة دائماً `{ "ar": "...", "en": "..." }`.
- الغلاف: `{ "data": ... }` و`{ "data": [...], "meta": { currentPage, lastPage, perPage, total } }` للقوائم المرقّمة.
- أخطاء: `401` غير مصادَق، `403` لا صلاحية، `404`، `419` CSRF منتهٍ، `422` `{ message, errors: { field: [..] } }`، `423` الحساب مقفل، `429` تجاوز المعدل (مع `Retry-After`).
- كل الاستجابات `Content-Type: application/json` وترويسات الأمان من Middleware `SecurityHeaders`.

---

## 1) Public API — `/api/v1` (بدون مصادقة، للقراءة + نماذج عامة)

يُستدعى من خادم Next.js فقط (ليس من المتصفح مباشرة). القراءة مخزّنة في Redis 5 دقائق وتُبطل عند النشر.

| Method | Path | الاستجابة |
|---|---|---|
| GET | `/settings` | `SiteSettings` |
| GET | `/menus/{location}` (`header`، `footer`) | `MenuItem[]` |
| GET | `/pages/home/content` | `HomeContent` |
| GET | `/pages/{slug}` | `CmsPage` (المنشورة فقط، الأقسام الظاهرة والمجدولة حالياً) |
| GET | `/services` | `Service[]` |
| GET | `/products?type=account` | `AccountProduct[]` |
| GET | `/financing` · `/financing/{id}` | `FinancingProduct[]` · `FinancingProduct` |
| GET | `/cards` · `/cards/{id}` | `CardProduct[]` · `CardProduct` |
| GET | `/news?category=&page=&perPage=` | `Paginated<NewsItem>` (published و publishedAt ≤ now) |
| GET | `/news/{slug}` | `NewsDetail` |
| GET | `/news-categories` | `NewsCategory[]` |
| GET | `/offers` | `Offer[]` (النشطة: startsAt ≤ اليوم ≤ endsAt) |
| GET | `/branches?city=&q=` · `/atms` · `/agents` | `Location[]` |
| GET | `/faqs` | `FaqGroup[]` |
| GET | `/jobs` · `/jobs/{slug}` | `Job[]` (المفتوحة فقط) · `Job` |
| GET | `/sitemap` | `{ path: string; updatedAt: string }[]` (مسارات بلا بادئة لغة) |
| POST | `/applications` | body: `ApplicationInput` → `201 { data: { reference } }` |
| POST | `/contact` | `ContactInput` → 201 |
| POST | `/complaints` | multipart `ComplaintInput` + `attachment?` → 201 |
| POST | `/jobs/{slug}/apply` | multipart `JobApplicationInput` + `cv` → 201 |
| POST | `/track` | `{ path, referrer? }` → 204 (عدّاد زيارات بلا كوكيز، IP مُجزّأ بملح يومي) |

### حماية النماذج العامة
1. Rate limit: 5 طلبات/دقيقة و30/يوم لكل IP لكل نموذج → 429.
2. `website` (honeypot) غير فارغ → `201` برقم مرجعي وهمي **دون حفظ** (لا نُعلِم البوت).
3. `turnstileToken` يُتحقق منه مع Cloudflare عند ضبط `TURNSTILE_SECRET`؛ وإلا يُتجاوز (بيئة التطوير).
4. التحقق بقواعد `VALIDATION` نفسها الموجودة في `api-types`.
5. الرفع: MIME حقيقي (finfo) + امتداد + ≤ 5MB، يُخزن في قرص `private` باسم عشوائي، لا يُخدم إلا عبر رابط موقّع من لوحة التحكم.
6. رقم الهوية والهاتف مشفّران في القاعدة (`encrypted` cast) ويُعرضان مُقنّعين في اللوحة.

---

## 2) Admin API — `/api/admin/v1` (Sanctum SPA cookie + RBAC + Audit)

لوحة التحكم تعمل من نطاق مستقل، وتمرّر الطلبات عبر Next.js rewrite: `/backend/*` → `API_ORIGIN/*` (نفس الأصل → كوكيز first-party).
التسلسل: `GET /sanctum/csrf-cookie` ثم إرسال `X-XSRF-TOKEN` في كل طلب كتابة.

### المصادقة
| Method | Path | ملاحظات |
|---|---|---|
| POST | `/auth/login` | `LoginInput` → `LoginResult`. 5 محاولات فاشلة → قفل 15 دقيقة (423) + audit `lockout` |
| POST | `/auth/two-factor-challenge` | `{ code }` أو `{ recoveryCode }` → `{ user }` |
| POST | `/auth/logout` | 204 |
| GET | `/auth/me` | `AdminUser` |
| POST | `/auth/forgot-password` | `{ email }` → 202 دائماً (لا يكشف وجود البريد) |
| POST | `/auth/reset-password` | `{ token, email, password, passwordConfirmation }` → 204 |
| POST | `/auth/two-factor` | تفعيل → `TwoFactorSetup` |
| POST | `/auth/two-factor/confirm` | `{ code }` → `{ recoveryCodes: string[] }` |
| DELETE | `/auth/two-factor` | يتطلب `{ password }` |
| PUT | `/auth/password` | `{ currentPassword, password, passwordConfirmation }` |
| GET | `/auth/sessions` · DELETE `/auth/sessions/{id}` | `AdminSession[]` |

سياسة كلمة المرور: ≥ 12 حرفاً، أحرف كبيرة وصغيرة وأرقام ورموز، وغير مسرّبة (`Password::uncompromised()` في الإنتاج). 2FA إلزامي لأدوار `super_admin` و`content_manager` عند ضبط `ADMIN_REQUIRE_2FA=true`.
الجلسة: انتهاء بعد 15 دقيقة خمول، تجديد المعرّف عند الدخول، كوكي `Secure; HttpOnly; SameSite=Strict`.

### الموارد (CRUD موحّد)
لكل مورد في الجدول: `GET /{r}` (قائمة مرقمة بـ `ListQuery`)، `POST /{r}`، `GET /{r}/{id}`، `PUT /{r}/{id}`، `DELETE /{r}/{id}` (حذف ناعم حيث ينطبق)، `POST /{r}/bulk` (`BulkInput` → `BulkResult`).

| Resource | الحالة | إجراءات إضافية |
|---|---|---|
| `pages` | ContentStatus | `PUT /pages/{id}/sections` (مصفوفة الأقسام كاملة بالترتيب) · `POST /pages/{id}/publish` · `POST /pages/{id}/schedule {publishAt}` |
| `news` | ContentStatus | `POST /news/{id}/submit` (→pending_review) · `/approve` · `/reject {reason}` · `/publish` · `/schedule {publishAt}` |
| `news-categories` | — | |
| `services` · `products` · `financing-products` · `cards` · `offers` · `banners` · `faqs` · `faq-categories` · `branches` · `atms` · `agents` · `jobs` | ActiveStatus (`jobs`: + `closed`) | `PATCH /{r}/reorder { ids: number[] }` حيث يوجد `position` |
| `menus` | — | العناصر متداخلة داخل المورد `items: MenuItem[]` |
| `media` | — | `POST /media` multipart (`file`, `alt[ar]`, `alt[en]`) · `GET /media?kind=image` |
| `users` | active/inactive | `PUT /users/{id}/roles { roles }` (audit `change_permissions`) · `POST /users/{id}/unlock` |
| `roles` | — | `PUT /roles/{id}/permissions { permissions }` · `GET /permissions` (كل الصلاحيات مجمعة حسب المورد) |
| `applications` | ApplicationStatus | `GET ?filter[type]=financing` · `PATCH /applications/{id} { status?, assignedTo? }` · `POST /applications/{id}/notes { body }` · `GET /applications/export?…` (CSV، audit `export`) |
| `contact-requests` · `complaints` · `job-applications` | ApplicationStatus | مثل applications · `GET /complaints/{id}/attachment` و`/job-applications/{id}/cv` → رابط موقّع مدته 5 دقائق |
| `audit-logs` | قراءة فقط | فلاتر: `filter[userId]` `filter[action]` `filter[resourceType]` `filter[from]` `filter[to]` |
| `settings` | — | `GET /settings` → كائن مفاتيح · `PUT /settings` (جزئي) |
| `seo` | — | `GET /seo?filter[path]=` · `PUT /seo/{id}` — SEO الخاص بالكيانات يأتي داخل المورد نفسه كحقل `seo: Seo` |

`GET /dashboard` → `DashboardData`.

### الصلاحيات (`<resource>.<ability>`)
القدرات: `view` `create` `update` `delete` `publish` `approve` `export`.
الموارد: `pages news news-categories services products financing-products cards offers banners faqs branches atms agents jobs menus media users roles settings seo applications contact-requests complaints job-applications audit-logs dashboard`.

| الدور | الصلاحيات |
|---|---|
| super_admin | الكل (Gate::before) |
| content_manager | كل المحتوى (pages, services, products, financing-products, cards, faqs, menus, media, banners, seo, settings.view) view/create/update/delete/publish |
| news_manager | news + news-categories + media: view/create/update/delete/publish/approve |
| marketing_manager | offers, banners, media, seo: الكل · news: view/create/update · dashboard.view |
| hr_manager | jobs: الكل · job-applications: view/update/export |
| branch_manager | branches, atms, agents: الكل |
| customer_service | applications, contact-requests, complaints: view/update · dashboard.view |
| reviewer | news + pages: view/approve (لا يملك create/update — فصل المهام) |
| viewer | كل `*.view` عدا users, roles, audit-logs, settings |

### Audit
كل عملية كتابة في Admin API تُسجّل تلقائياً (Observer + Middleware): المستخدم، الإجراء، المورد، القيم قبل/بعد (مع إخفاء الحقول الحساسة)، IP، User-Agent، الوقت. جدول `audit_logs` إلحاق فقط (لا update/delete من التطبيق).

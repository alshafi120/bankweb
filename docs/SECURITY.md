# الأمان — Withaq Bank Platform

المنصة تُعامَل كنظام عالي الحساسية. هذا الملف يربط كل متطلب بمكان تطبيقه في الكود.

## الحدود والفصل المصرفي
- الموقع ولوحة التحكم والـ API **لا يملكون أي اتصال** بقاعدة بيانات Core Banking. أي تكامل مستقبلي يمر عبر `apps/api/app/Modules/Integration` (واجهات Ports + محولات Null حالياً + جدول `integration_outbox`).
- الطلبات العامة (فتح حساب، تمويل، بطاقة…) نوايا تُراجع يدوياً، وليست عمليات مالية.
- "تسجيل الدخول" في الموقع رابط إلى بوابة Internet Banking الرسمية فقط.

## OWASP Top 10 (2021)
| البند | التطبيق |
|---|---|
| A01 Broken Access Control | RBAC بصلاحيات `<resource>.<ability>` على كل مسار إداري (Policies + `Gate::before` للمشرف العام)، فصل المهام في الأخبار (الكاتب لا يعتمد مقاله)، الـ API الإداري مغلق على نطاق `admin` في Nginx (`/api/admin/` → 404 على نطاق الـ API العام)، قائمة IP للوحة (`ADMIN_ALLOW_CIDR` + `EnsureAdminIpAllowed`). اختبارات 403 في `tests/Feature/Admin`. |
| A02 Cryptographic Failures | HTTPS فقط + HSTS preload، Argon2id لكلمات المرور، تشفير رقم الهوية والهاتف على مستوى التطبيق (`encrypted` cast) مع عمود hash للمطابقة، أسرار 2FA ورموز الاسترداد مشفّرة/مُجزّأة، IP الزوار يُخزن HMAC وليس نصاً. |
| A03 Injection | Eloquent/Query Builder فقط، FormRequest لكل نقطة إدخال، تنقية HTML بقائمة سماح (mews/purifier) في الخادم + مُنقٍّ ثانٍ في الموقع، React يرمّز الإخراج افتراضياً، JSON-LD يُهرَّب (`<` → `<`). |
| A04 Insecure Design | honeypot + Turnstile + حدود معدّل لكل نموذج، قفل الحساب بعد 5 محاولات، حماية إعادة استخدام رمز TOTP. |
| A05 Security Misconfiguration | CSP بـ nonce و`strict-dynamic` في الموقع واللوحة، `frame-ancestors 'none'`، `X-Frame-Options: DENY`، `nosniff`، Permissions-Policy، `X-Robots-Tag: noindex` للوحة، `APP_DEBUG=false`، `expose_php=Off`، `server_tokens off`. |
| A06 Vulnerable Components | `npm audit --omit=dev` = 0 للتطبيقين، `composer audit` في CI، إصدارات مثبتة بدقة. |
| A07 Identification & Auth Failures | Sanctum SPA (كوكي `Secure; HttpOnly; SameSite=Strict`)، CSRF عبر `XSRF-TOKEN`، 2FA (TOTP) إلزامي قابل للضبط `ADMIN_REQUIRE_2FA`، سياسة كلمة مرور ≥12 مع فحص التسريب في الإنتاج، مهلة خمول 15 دقيقة، تجديد معرّف الجلسة، عرض الجلسات النشطة وإنهاؤها، رسالة نسيان كلمة المرور لا تكشف وجود البريد. |
| A08 Software & Data Integrity | رفع الملفات: فحص MIME الحقيقي + الامتداد + الحجم، إعادة ترميز الصور (إزالة البيانات الوصفية)، تخزين خاص بأسماء عشوائية، تنزيل عبر روابط موقّعة مؤقتة (5 دقائق). ClamAV اختياري عبر `CLAMAV_SOCKET`. |
| A09 Logging & Monitoring | `audit_logs` إلحاق فقط (التعديل والحذف يرميان استثناءً): الدخول، الخروج، الفشل، القفل، الإنشاء، التعديل (قبل/بعد مع إخفاء الحقول الحساسة)، الحذف، النشر، الاعتماد، الرفض، تغيير الصلاحيات، التصدير — مع IP وUser-Agent. |
| A10 SSRF | لا يجلب الخادم روابط يحددها المستخدم؛ الطلبات الصادرة الوحيدة: Turnstile وwebhook إعادة التوليد (عنوان ثابت من الإعدادات). |

## طبقات الحماية في البنية
Cloudflare (WAF، DDoS، Bot) → Nginx (TLS 1.2+، حدود معدّل، منع النطاقات المجهولة، IP allow-list للوحة) → التطبيقات (CSP، CSRF، RBAC، التحقق) → قاعدة البيانات على شبكة خاصة غير منشورة.

## ما يجب فعله قبل الإطلاق
1. إصدار شهادات TLS وتفعيل Cloudflare "Full (strict)" وقبول اتصالات المنشأ من عناوين Cloudflare فقط.
2. ضبط كل أسرار `infra/docker/.env` بقيم عشوائية طويلة، و`ADMIN_REQUIRE_2FA=true`.
3. تفعيل Turnstile (مفتاح الموقع من الإعدادات + `TURNSTILE_SECRET`).
4. ربط ClamAV وخدمة البريد، ونسخ احتياطي مشفّر لـ MySQL وMinIO.
5. اختبار اختراق مستقل ومراجعة امتثال لمتطلبات البنك المركزي اليمني قبل الإنتاج.

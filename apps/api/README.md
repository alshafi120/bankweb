# Withaq Bank API — `apps/api`

Laravel 12 REST API (modular monolith) for the public website (`apps/web`) and the admin dashboard / CMS (`apps/admin`).
Contract: `docs/API.md`, `docs/DATABASE.md`, `packages/api-types/src/index.ts`. OpenAPI 3.1: [`openapi.yaml`](openapi.yaml).

> «وِثاق» اسم افتراضي. الإصدار الأول لا يتصل بأنظمة Core Banking إطلاقاً — الطلبات العامة "نوايا" تُسجَّل فقط.

---

## العربية

### المتطلبات
- PHP 8.3+ مع الامتدادات: `pdo_mysql` (أو `pdo_sqlite` للاختبارات)، `mbstring`، `intl`، `gd`، `fileinfo`، `openssl`، `redis` (phpredis)، `zip`.
- Composer 2، MySQL 8 (`utf8mb4_unicode_ci`)، Redis 6+ (كاش، طوابير، Rate limit).
- خيارياً: ClamAV (`CLAMAV_SOCKET`) لفحص الملفات المرفوعة.

### التثبيت
```bash
cd apps/api
composer install --no-dev --optimize-autoloader     # في التطوير: composer install
cp .env.example .env
php artisan key:generate
# عدّل .env: DB_* · REDIS_* · FRONTEND_URL · ADMIN_URL · SANCTUM_STATEFUL_DOMAINS · REVALIDATE_SECRET · ADMIN_*
php artisan migrate --seed
php artisan storage:link                              # وسائط القرص العام (MEDIA_DISK=public)
```

### أول مدير (super_admin)
لا توجد كلمة مرور مكتوبة في الكود. ضع في `.env` ثم شغّل البذرة:
```bash
ADMIN_EMAIL=it-admin@bank.ye
ADMIN_USERNAME=admin
ADMIN_NAME="System Administrator"
ADMIN_PASSWORD='≥12 حرفاً: كبيرة وصغيرة وأرقام ورموز'
php artisan db:seed --class=AdminUserSeeder
```
البذرة ترفض كلمة مرور ضعيفة أو فارغة ولا تعدّل مستخدماً موجوداً. احذف `ADMIN_PASSWORD` من البيئة بعدها، وفعّل 2FA عند أول دخول (إلزامي لـ `super_admin` و`content_manager` عند `ADMIN_REQUIRE_2FA=true`).

### البذور
| البذرة | متى | المحتوى |
|---|---|---|
| `PermissionSeeder` · `RoleSeeder` | دائماً | كل صلاحيات `<resource>.<ability>` + الأدوار التسعة بمصفوفة `docs/API.md` |
| `AdminUserSeeder` | عند ضبط `ADMIN_EMAIL` | أول super admin |
| `DemoContentSeeder` | دائماً | كل محتوى الموقع التجريبي (الإعدادات، القوائم، المدن، المنتجات، الفروع/الصرافات/الوكلاء، الأخبار، العروض، الأسئلة، الوظائف، أقسام الرئيسية `home:*`، صفحات CMS) — من `database/seeders/data/demo-content.json` |
| `DemoUsersSeeder` | `APP_ENV=local` + `DEMO_USERS_PASSWORD` | مستخدم لكل دور: `demo.<role>` |
| `DemoActivitySeeder` | `APP_ENV=local` | طلبات/شكاوى/تواصل/طلبات توظيف وهمية + زيارات 30 يوماً |

تحديث JSON المحتوى التجريبي من مصدر الموقع (يتطلب `npm install` في `apps/web`):
```bash
node scripts/export-web-demo.cjs ../web database/seeders/data/demo-content.json
```

### العمليات الخلفية
```bash
php artisan queue:work redis --queue=default --tries=3 --max-time=3600   # إشعارات الموظفين + RevalidateFrontend
* * * * * cd /var/www/api && php artisan schedule:run >> /dev/null 2>&1   # crontab
```
المجدول: `content:publish-scheduled` كل دقيقة (نشر الصفحات/الأخبار المجدولة)، `analytics:prune` يومياً، تنظيف رموز إعادة التعيين والطوابير الفاشلة.

### الاختبارات
```bash
vendor/bin/phpunit                 # SQLite في الذاكرة — لا يحتاج MySQL ولا Redis
# أو: php artisan test  (يتطلب حزمة nunomaduro/collision في dev)
```

### النشر خلف Nginx + Cloudflare
- `TRUSTED_PROXIES` = شبكة Nginx **وخادم Next.js للموقع** (الموقع يمرّر `X-Forwarded-For` للنماذج والتتبع؛ بدونه يصبح حدّ المعدل لكل خادم الموقع لا لكل زائر).
- Nginx: `client_max_body_size 6m;` · `fastcgi_hide_header X-Powered-By;` · وجّه كل شيء إلى `public/index.php`.
- لوحة التحكم على نطاق مستقل خلف Cloudflare Zero Trust، ويمكن تقييدها أيضاً بـ `ADMIN_IP_ALLOWLIST`.
- بعد كل نشر: `php artisan migrate --force && php artisan config:cache && php artisan route:cache && php artisan queue:restart`.

### ربط الواجهتين
| التطبيق | المتغيرات |
|---|---|
| `apps/web` | `API_BASE_URL=https://api.bank.ye/api/v1` · `REVALIDATE_SECRET` = نفس قيمة `REVALIDATE_SECRET` هنا · وفي الـ API: `FRONTEND_REVALIDATE_URL=https://www.bank.ye/api/revalidate` |
| `apps/admin` | `API_ORIGIN=https://api.bank.ye` · `NEXT_PUBLIC_DEMO_MODE=false` — اللوحة تمرّر `/backend/*` إلى الـ API (نفس الأصل)، لذا: `SANCTUM_STATEFUL_DOMAINS=admin.bank.ye` و`ADMIN_URL=https://admin.bank.ye` و`SIGNED_URL_BASE=https://admin.bank.ye/backend` و`SESSION_DOMAIN` فارغ |

---

## English

### Requirements
PHP 8.3+ (`pdo_mysql`, `mbstring`, `intl`, `gd`, `fileinfo`, `openssl`, `redis`, `zip`), Composer 2, MySQL 8, Redis 6+. Optional ClamAV.

### Install
```bash
composer install            # --no-dev --optimize-autoloader in production
cp .env.example .env && php artisan key:generate
php artisan migrate --seed
php artisan storage:link
```
Local quick start without MySQL/Redis: set `DB_CONNECTION=sqlite`, `DB_DATABASE=/abs/path/database/database.sqlite`, `CACHE_STORE=file`, `QUEUE_CONNECTION=sync`, `SESSION_SECURE_COOKIE=false`, `APP_ENV=local`, then `touch database/database.sqlite && php artisan migrate:fresh --seed && php artisan serve --port=8000`.

### `.env` keys
| Key | Purpose |
|---|---|
| `APP_KEY` | `php artisan key:generate` — also keys the PII/IP HMACs (rotate = re-hash) |
| `FRONTEND_URL`, `ADMIN_URL` | CORS allow-list; reset-password links point to `ADMIN_URL` |
| `SANCTUM_STATEFUL_DOMAINS` | Admin host(s) only (`admin.bank.ye`). Never the public site |
| `SESSION_DRIVER=database`, `SESSION_LIFETIME=15`, `SESSION_SECURE_COOKIE=true`, `SESSION_SAME_SITE=strict` | Admin session policy |
| `TRUSTED_PROXIES` | Nginx/Cloudflare **and the Next.js web server** CIDRs |
| `CACHE_STORE=redis`, `QUEUE_CONNECTION=redis`, `REDIS_*` | Cache (versioned keys), queues, rate limits |
| `MEDIA_DISK`, `MEDIA_URL`, `AWS_*` | Public media (local `public` or S3-compatible) |
| `SIGNED_URL_BASE` | Base of 5-minute signed links to private files (`https://admin.bank.ye/backend`) |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET` | Cloudflare Turnstile; empty secret = verification skipped (dev only) |
| `FORMS_PER_MINUTE=5`, `FORMS_PER_DAY=30`, `FORMS_NOTIFY_EMAIL` | Public form limits & staff notification recipients |
| `FRONTEND_REVALIDATE_URL`, `REVALIDATE_SECRET` | On-demand ISR webhook of `apps/web` |
| `ADMIN_REQUIRE_2FA`, `ADMIN_IP_ALLOWLIST` | Admin hardening |
| `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_NAME`, `ADMIN_PASSWORD` | First super admin (seeder refuses weak/missing password) |
| `DEMO_USERS_PASSWORD` | Local only: password of `demo.<role>` users |
| `CLAMAV_SOCKET` | Optional AV scan of uploads |
| `INTEGRATION_OUTBOX_ENABLED` | Record integration intents in `integration_outbox` (Null adapters) |

### First admin
Set `ADMIN_EMAIL` / `ADMIN_USERNAME` / `ADMIN_NAME` / `ADMIN_PASSWORD`, run `php artisan db:seed --class=AdminUserSeeder`, then remove `ADMIN_PASSWORD` and enrol 2FA at first sign-in.

### Workers & scheduler
`php artisan queue:work redis` (staff notifications, ISR revalidation) and the `schedule:run` cron every minute (`content:publish-scheduled`).

### Tests
`vendor/bin/phpunit` — SQLite in-memory, no external services (`php artisan test` additionally needs `nunomaduro/collision` as a dev dependency).

### Deployment (Nginx + Cloudflare)
Serve `public/` through PHP-FPM, `client_max_body_size 6m`, TLS at Cloudflare, `TRUSTED_PROXIES` set, admin host behind Zero Trust. Deploy: `migrate --force`, `config:cache`, `route:cache`, `queue:restart`.

### Pointing the frontends at the API
- **apps/web**: `API_BASE_URL=https://api.bank.ye/api/v1`, same `REVALIDATE_SECRET` on both sides, and `FRONTEND_REVALIDATE_URL=https://www.bank.ye/api/revalidate` here.
- **apps/admin**: `API_ORIGIN=https://api.bank.ye`, `NEXT_PUBLIC_DEMO_MODE=false`. The dashboard rewrites `/backend/*` → `API_ORIGIN/*`, so the browser is same-origin: keep `SANCTUM_STATEFUL_DOMAINS=admin.bank.ye`, `ADMIN_URL=https://admin.bank.ye`, `SIGNED_URL_BASE=https://admin.bank.ye/backend`, `SESSION_DOMAIN` empty.

---

## Architecture (short)
```
app/
  Modules/<Module>/{Domain,Application,Infrastructure,Http}   Identity · Content · Catalog · News · Network ·
                                                             Applications · Careers · Media · Audit · Analytics · Integration
  Support/Admin      AdminResource + Field + ListQuery + ResourceRegistry → one generic CRUD controller for 19 resources
  Support/Concerns   HasLocalizedAttributes (title_ar/en ⇄ {ar,en}), HasStatus, HasSeo, Sluggable, HasPosition, TracksAuthors
  Support/Content    ContentCache (versioned keys) + InvalidatesContentCache (observer → bump + RevalidateFrontend job)
  Support/Security   HtmlSanitizer (mews/purifier allow-list), Masker, PiiHasher (HMAC)
routes/api_v1.php    /api/v1 public          routes/admin_v1.php   /api/admin/v1 admin
```
Security highlights: argon2id; lockout after 5 failures (423) + audit; TOTP 2FA (google2fa, QR SVG via bacon-qr-code, hashed recovery codes); `Gate::before` for super_admin + `<resource>.<ability>` permissions; Maker/Checker on news (an author never approves/publishes their own article); encrypted PII + HMAC hash columns; masked PII in the inbox and CSV; files on a private disk behind 5-minute signed URLs; finfo MIME + extension allow-list + 5 MB + GD re-encode; honeypot → fake 201; Turnstile; per-IP-per-form rate limits; append-only audit log; strict security headers and CORS.

Integration layer (`app/Modules/Integration`): ports `CoreBankingPort`, `SmsPort`, `EmailPort`, `KycPort`, `RemittancePort` bound to Null adapters, and `OutboxWriter` → `integration_outbox`. v1 never talks to core banking.

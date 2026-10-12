# منصة بنك وِثاق — Withaq Bank Platform

موقع مصرفي عام + لوحة تحكم إدارية (CMS) + REST API، بالعربية والإنجليزية.
"بنك وِثاق" اسم وهوية افتراضيان؛ تُستبدل الأسماء والأرقام والشعار من الإعدادات.

| المجلد | التقنية | الوصف |
|---|---|---|
| `apps/web` | Next.js 16 · TypeScript · Tailwind | الموقع العام: الرئيسية + كل الصفحات + النماذج الست ([PAGES.md](apps/web/PAGES.md)) |
| `apps/admin` | Next.js 16 · TypeScript · Tailwind | لوحة التحكم: الدخول و2FA، المؤشرات، إدارة المحتوى، منشئ الصفحات، الوسائط، الطلبات، المستخدمون والصلاحيات، سجل العمليات، الإعدادات ([README](apps/admin/README.md)) |
| `apps/api` | Laravel 12 · Sanctum · MySQL · Redis | الـ API العام والإداري، قاعدة البيانات، RBAC، التدقيق ([README](apps/api/README.md) · [openapi.yaml](apps/api/openapi.yaml)) |
| `packages/api-types` | TypeScript | عقد البيانات المشترك (المصدر الوحيد للأشكال) |
| `infra/` | Docker Compose · Nginx | تشغيل كامل: MySQL، Redis، MinIO، الطوابير، المجدول، الحافة |
| `docs/` | | [المعمارية](docs/ARCHITECTURE.md) · [نظام التصميم](docs/DESIGN-SYSTEM.md) · [الـ API](docs/API.md) · [قاعدة البيانات](docs/DATABASE.md) · [الأمان](docs/SECURITY.md) |

## تشغيل سريع (تطوير محلي)

المتطلبات: Node.js 22+، PHP 8.3 مع (pdo_mysql أو pdo_sqlite، redis، gd، intl، zip)، Composer 2، MySQL 8 و Redis (أو SQLite للتجربة).

```bash
# 1) الـ API
cd apps/api
composer install
cp .env.example .env && php artisan key:generate
# اضبط DB_* و ADMIN_EMAIL و ADMIN_PASSWORD في .env (وللتجربة: APP_ENV=local و DEMO_USERS_PASSWORD)
php artisan migrate --seed
php artisan serve --port=8000          # + php artisan queue:work  و  php artisan schedule:work

# 2) الموقع العام
cd ../web && npm install
API_BASE_URL=http://127.0.0.1:8000/api/v1 SITE_URL=http://localhost:3000 REVALIDATE_SECRET=<نفس قيمة الـ API> npm run dev

# 3) لوحة التحكم
cd ../admin && npm install
API_ORIGIN=http://127.0.0.1:8000 NEXT_PUBLIC_DEMO_MODE=false npm run dev -- -p 3001
```

- بدون `API_BASE_URL` يعمل الموقع على بيانات تجريبية، وبدون `API_ORIGIN` تعمل اللوحة في **وضع تجريبي** (الدخول: `admin@withaq.example` / `Demo@Withaq2026!` ورمز التحقق `123456`).
- في الإنتاج استخدم `infra/docker/docker-compose.yml` (التعليمات في رأس الملف) خلف Cloudflare.

## الاختبارات

```bash
cd apps/api   && vendor/bin/phpunit            # 60 اختباراً
cd apps/web   && npm run typecheck && npm test && npm run build
cd apps/admin && npx tsc --noEmit && npm run build
```

CI جاهز في `.github/workflows/ci.yml`.

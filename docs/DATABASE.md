# قاعدة البيانات — MySQL 8 (utf8mb4_unicode_ci)

قواعد عامة:
- كل جدول: `id BIGINT UNSIGNED PK`، `created_at`، `updated_at`. المحتوى: `deleted_at` (حذف ناعم) + `created_by`/`updated_by` FK → users (nullable, set null).
- الحقول ثنائية اللغة: عمودان `*_ar` و`*_en` (للبحث والفهرسة)؛ القوائم ثنائية اللغة (مميزات، متطلبات) أعمدة JSON `*_ar`/`*_en`.
- `slug` فريد. `position INT` للترتيب. `status` بصيغة ENUM-like VARCHAR(20) + فهرس.
- الحقول الحساسة (`national_id`, `phone`) مشفّرة بـ `encrypted` cast (TEXT) + عمود `*_hash` (SHA-256 مع مفتاح) للبحث المطابق.
- SEO: علاقة polymorphic `seo_metadata (seoable_type, seoable_id)`.

## الهوية والصلاحيات
| الجدول | الأعمدة |
|---|---|
| users | name, username (unique), email (unique), password (argon2id), is_active, two_factor_secret (encrypted, null), two_factor_recovery_codes (encrypted, null), two_factor_confirmed_at, failed_login_attempts, locked_until, last_login_at, last_login_ip, password_changed_at, remember_token |
| roles | name (unique slug), label_ar, label_en, description |
| permissions | name (unique `resource.ability`), resource, ability |
| role_user | role_id, user_id (PK مركب) |
| permission_role | permission_id, role_id (PK مركب) |
| sessions | (Laravel database sessions) id, user_id, ip_address, user_agent, payload, last_activity |
| password_reset_tokens | email (PK), token (hash), created_at |
| personal_access_tokens | (Sanctum — غير مستخدم للوحة لكنه للتكامل المستقبلي) |

## المحتوى
| الجدول | الأعمدة |
|---|---|
| pages | slug, title_ar, title_en, summary_ar, summary_en, template (default/home), status, publish_at, published_at |
| page_sections | page_id FK cascade, type, position, is_visible, starts_at, ends_at, data JSON (حسب `BlockDataMap`) |
| services | slug, icon, title_ar/en, summary_ar/en, body_ar/en, href, position, status |
| products | slug, account_type, name_ar/en, tagline_ar/en, features_ar/en JSON, requirements_ar/en JSON, minimum_balance BIGINT null, currency, position, status |
| financing_products | slug, name_ar/en, summary_ar/en, body_ar/en, max_amount BIGINT, max_months, annual_profit_rate DECIMAL(5,2), requirements_ar/en JSON, position, status |
| cards | slug, name_ar/en, summary_ar/en, network, tone, features_ar/en JSON, fees_ar/en, position, status |
| news_categories | slug, name_ar/en, position |
| news | slug, news_category_id FK, title_ar/en, excerpt_ar/en, content_ar/en (LONGTEXT HTML منقّى), featured_media_id FK media null, author_id FK users, status, publish_at, published_at, reviewed_by, reviewed_at, review_note |
| offers | slug, title_ar/en, details_ar/en, media_id null, href, starts_at DATE, ends_at DATE, position, status |
| banners | title_ar/en, subtitle_ar/en, media_id, cta_label_ar/en, cta_href, placement, starts_at, ends_at, position, status |
| faq_categories | slug, name_ar/en, position |
| faqs | faq_category_id FK, question_ar/en, answer_ar/en, is_featured (للرئيسية), position, status |
| cities | slug, name_ar/en, governorate_ar/en, lat, lng |
| branches · atms · agents | slug, city_id FK, name_ar/en, district_ar/en, address_ar/en, phone, hours_ar/en, services_ar/en JSON, lat DECIMAL(10,7), lng DECIMAL(10,7), status (+ `branches.manager_name`, `atms.is_24h`, `atms.supports_deposit`, `agents.agent_code`) |
| jobs | slug, title_ar/en, department_ar/en, city_id, employment_type, summary_ar/en, description_ar/en, requirements_ar/en JSON, closes_at DATE, status (active/inactive/closed) |
| menus | location (unique: header/footer), name |
| menu_items | menu_id FK cascade, parent_id null, label_ar/en, href, position, is_visible |
| settings | key (unique), value JSON, group |
| seo_metadata | seoable_type, seoable_id, path (للصفحات الثابتة), title_ar/en, description_ar/en, keywords_ar/en, canonical, og_media_id, noindex |
| media | disk, path, filename, original_name, mime, kind, size, width, height, alt_ar/en, checksum, uploaded_by |
| documents | title_ar/en, media_id, category (report/governance/policy), year, position, status |

## الطلبات
| الجدول | الأعمدة |
|---|---|
| applications | reference (unique), type (account/financing/card), status, full_name, national_id (enc), national_id_hash, phone (enc), phone_hash, email, city, locale, account_type null, branch_id null, assigned_to null, ip_hash, user_agent, submitted_at |
| financing_requests | application_id FK cascade (unique), financing_product_id FK, amount, months, monthly_income, employer, notes |
| card_requests | application_id FK cascade (unique), card_id FK, has_account, account_last4 |
| application_notes | notable_type, notable_id, user_id, body |
| contact_requests | reference, status, full_name, phone (enc), phone_hash, email, subject, message, preferred_time, locale, assigned_to, ip_hash |
| complaints | reference, status, full_name, phone (enc), phone_hash, email, national_id (enc, null), category, branch_id null, transaction_date, description, attachment_path (private disk), locale, assigned_to, resolved_at, ip_hash |
| job_applications | reference, job_id FK, status, full_name, phone (enc), email, city, education, experience_years, cover_letter, cv_path (private disk), locale, ip_hash |

## السجلات والتحليلات
| الجدول | الأعمدة |
|---|---|
| audit_logs | user_id null, action, resource_type, resource_id, resource_label, changes JSON, ip_address, user_agent, created_at (بدون updated_at — إلحاق فقط) — فهارس: (user_id, created_at), (resource_type, resource_id), action |
| activity_logs | user_id, description, properties JSON, created_at — نشاط عام غير أمني (معاينة، تصدير مسودة…) |
| page_views | date, path, referrer_host, source (direct/search/social/referral), visitor_hash (IP+UA+ملح يومي)، فهرس (date, path) |
| service_views | date, service_key, count — تجميعي يومي |

## العلاقات الرئيسية
users ⟷ roles ⟷ permissions (many-to-many) · pages 1→N page_sections · news N→1 news_categories, news N→1 media · faqs N→1 faq_categories · branches/atms/agents/jobs N→1 cities · applications 1→1 financing_requests / card_requests · applications/contact_requests/complaints 1→N application_notes (polymorphic) · job_applications N→1 jobs · كل شيء → seo_metadata (polymorphic).

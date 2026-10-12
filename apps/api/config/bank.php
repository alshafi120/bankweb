<?php

/*
| Withaq Bank — application-specific configuration.
*/
return [

    'reference_prefix' => env('BANK_REFERENCE_PREFIX', 'WTQ'),

    'admin' => [
        /* Require TOTP 2FA for super_admin and content_manager (docs/API.md). */
        'require_2fa' => (bool) env('ADMIN_REQUIRE_2FA', false),
        'require_2fa_roles' => ['super_admin', 'content_manager'],
        'max_login_attempts' => 5,
        'lockout_minutes' => 15,
        'recovery_codes' => 8,
        /* Optional comma separated IP allow-list enforced in addition to Cloudflare Zero Trust. */
        'ip_allowlist' => array_values(array_filter(array_map('trim', explode(',', (string) env('ADMIN_IP_ALLOWLIST', ''))))),
    ],

    'forms' => [
        'per_minute' => (int) env('FORMS_PER_MINUTE', 5),
        'per_day' => (int) env('FORMS_PER_DAY', 30),
        'upload_max_bytes' => 5 * 1024 * 1024,
        'notify_email' => env('FORMS_NOTIFY_EMAIL'),
    ],

    'validation' => [
        /* Mirrors VALIDATION in packages/api-types (PHP PCRE syntax). */
        'phone' => '/^(\+?967)?7[01378]\d{7}$/',
        'national_id' => '/^\d{8,12}$/',
        'account_last4' => '/^\d{4}$/',
        'full_name_min' => 6,
        'full_name_max' => 120,
        'message_min' => 20,
        'message_max' => 2000,
    ],

    'cache' => [
        'ttl' => (int) env('PUBLIC_CACHE_TTL', 300),
    ],

    'signed_url_minutes' => 5,

    /* Base prepended to relative signed file URLs (admin same-origin proxy), e.g. https://admin.bank.ye/backend */
    'signed_url_base' => env('SIGNED_URL_BASE'),

    /* ClamAV daemon socket for upload scanning, e.g. unix:///var/run/clamav/clamd.ctl (empty → disabled). */
    'clamav_socket' => env('CLAMAV_SOCKET', ''),

    /* Record integration intents in `integration_outbox` (Null adapters). v1 never calls core banking. */
    'integration_outbox' => (bool) env('INTEGRATION_OUTBOX_ENABLED', false),

    /*
    | Data retention for public requests (personal data). A scheduled command can purge closed
    | requests older than this many days.
    */
    'retention_days' => (int) env('APPLICATIONS_RETENTION_DAYS', 730),

];

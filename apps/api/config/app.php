<?php

return [

    'name' => env('APP_NAME', 'Withaq Bank API'),

    'env' => env('APP_ENV', 'production'),

    'debug' => (bool) env('APP_DEBUG', false),

    'url' => env('APP_URL', 'http://localhost'),

    /* Frontends allowed to call this API (CORS + Sanctum + links in e-mails). */
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),

    'admin_url' => env('ADMIN_URL', 'http://localhost:3001'),

    /* Yemen time (UTC+3). Stored timestamps are rendered with offset (ISO-8601). */
    'timezone' => env('APP_TIMEZONE', 'Asia/Aden'),

    'locale' => env('APP_LOCALE', 'ar'),

    'fallback_locale' => env('APP_FALLBACK_LOCALE', 'en'),

    'faker_locale' => env('APP_FAKER_LOCALE', 'ar_SA'),

    'cipher' => 'AES-256-CBC',

    'key' => env('APP_KEY'),

    'previous_keys' => [
        ...array_filter(
            explode(',', (string) env('APP_PREVIOUS_KEYS', ''))
        ),
    ],

    'maintenance' => [
        'driver' => env('APP_MAINTENANCE_DRIVER', 'file'),
        'store' => env('APP_MAINTENANCE_STORE', 'database'),
    ],

];

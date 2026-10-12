<?php

return [

    'postmark' => ['key' => env('POSTMARK_API_KEY')],

    'resend' => ['key' => env('RESEND_API_KEY')],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    /* Cloudflare Turnstile. Empty secret → verification skipped (local development only). */
    'turnstile' => [
        'site_key' => env('TURNSTILE_SITE_KEY'),
        'secret' => env('TURNSTILE_SECRET'),
        'verify_url' => 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        'timeout' => 5,
    ],

    /* Next.js on-demand revalidation webhook. */
    'frontend_revalidate' => [
        'url' => env('FRONTEND_REVALIDATE_URL'),
        'secret' => env('REVALIDATE_SECRET'),
    ],

];

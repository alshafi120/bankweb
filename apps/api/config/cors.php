<?php

/*
| CORS is locked to the two first-party frontends. The public site calls /api/v1 server-side
| (Next.js) so browsers normally never hit it cross-origin; the admin proxies /backend/* same-origin.
| These rules are the defence-in-depth fallback.
*/
return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => array_values(array_filter([
        env('FRONTEND_URL'),
        env('ADMIN_URL'),
    ])),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Accept', 'Content-Type', 'X-Requested-With', 'X-XSRF-TOKEN', 'Authorization'],

    'exposed_headers' => ['Retry-After', 'Content-Disposition'],

    'max_age' => 600,

    'supports_credentials' => true,

];

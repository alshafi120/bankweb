<?php

use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Laravel\Sanctum\Http\Middleware\AuthenticateSession;

return [

    /*
    | Hosts that receive stateful (cookie) authentication. Must contain the admin host
    | (e.g. admin.bank.ye). Never add the public website host.
    */
    'stateful' => array_values(array_filter(array_map('trim', explode(',', (string) env('SANCTUM_STATEFUL_DOMAINS', 'localhost:3001,127.0.0.1:3001'))))),

    'guard' => ['web'],

    /* Tokens are not used by the dashboard; future integration tokens expire after 60 minutes. */
    'expiration' => 60,

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', 'wtq_'),

    'middleware' => [
        'authenticate_session' => AuthenticateSession::class,
        'encrypt_cookies' => EncryptCookies::class,
        'validate_csrf_token' => ValidateCsrfToken::class,
    ],

];

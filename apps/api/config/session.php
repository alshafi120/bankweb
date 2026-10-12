<?php

use Illuminate\Support\Str;

return [

    /* Database sessions so admins can list and revoke their active sessions. */
    'driver' => env('SESSION_DRIVER', 'database'),

    /* 15 minutes idle timeout (docs/ARCHITECTURE.md §4). */
    'lifetime' => (int) env('SESSION_LIFETIME', 15),

    'expire_on_close' => env('SESSION_EXPIRE_ON_CLOSE', true),

    'encrypt' => env('SESSION_ENCRYPT', true),

    'files' => storage_path('framework/sessions'),

    'connection' => env('SESSION_CONNECTION'),

    'table' => env('SESSION_TABLE', 'sessions'),

    'store' => env('SESSION_STORE'),

    'lottery' => [2, 100],

    'cookie' => env(
        'SESSION_COOKIE',
        Str::slug((string) env('APP_NAME', 'withaq'), '_').'_session'
    ),

    'path' => env('SESSION_PATH', '/'),

    'domain' => env('SESSION_DOMAIN'),

    'secure' => env('SESSION_SECURE_COOKIE', true),

    'http_only' => true,

    'same_site' => env('SESSION_SAME_SITE', 'strict'),

    'partitioned' => env('SESSION_PARTITIONED_COOKIE', false),

];

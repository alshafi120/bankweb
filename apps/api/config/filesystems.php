<?php

return [

    /*
    | Default disk. Public media goes to `media` (local "public" in dev, S3-compatible in production);
    | applicant uploads (CVs, complaint attachments) ALWAYS go to `private`, which is outside the
    | web root and only reachable through short-lived signed URLs issued by the admin API.
    */
    'default' => env('FILESYSTEM_DISK', 'local'),

    'media_disk' => env('MEDIA_DISK', 'public'),

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => false,
            'throw' => false,
            'report' => false,
        ],

        'private' => [
            'driver' => env('PRIVATE_DISK_DRIVER', 'local'),
            'root' => storage_path('app/private/uploads'),
            'visibility' => 'private',
            'serve' => false,
            'throw' => true,
            'report' => true,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim((string) env('MEDIA_URL', rtrim((string) env('APP_URL', 'http://localhost'), '/').'/storage'), '/'),
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

    ],

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];

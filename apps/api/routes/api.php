<?php

use Illuminate\Support\Facades\Route;

/*
| /api/v1        → public, read-mostly API consumed server-side by apps/web (routes/api_v1.php)
| /api/admin/v1  → admin/CMS API (Sanctum SPA cookie + RBAC + audit) (routes/admin_v1.php)
*/
Route::prefix('v1')->name('v1.')->group(base_path('routes/api_v1.php'));
Route::prefix('admin/v1')->name('admin.')->group(base_path('routes/admin_v1.php'));

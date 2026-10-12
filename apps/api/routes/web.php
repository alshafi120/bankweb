<?php

use Illuminate\Support\Facades\Route;

/*
| No HTML is served by this application. The "web" middleware group is still used by
| Sanctum's /sanctum/csrf-cookie route (registered by the Sanctum service provider).
*/
Route::get('/', fn () => response()->json(['name' => config('app.name'), 'docs' => '/openapi.yaml']));

<?php

use App\Modules\Analytics\Http\Controllers\Public\TrackController;
use App\Modules\Applications\Http\Controllers\Public\SubmissionController;
use App\Modules\Careers\Http\Controllers\Public\JobController;
use App\Modules\Catalog\Http\Controllers\Public\CatalogController;
use App\Modules\Content\Http\Controllers\Public\ContentController;
use App\Modules\Network\Http\Controllers\Public\LocationController;
use App\Modules\News\Http\Controllers\Public\NewsController;
use Illuminate\Support\Facades\Route;

/*
| Public API — /api/v1 (docs/API.md §1). No authentication; called server-side by apps/web.
| Reads are cached (versioned keys, invalidated on publish). Forms: rate limit → honeypot → validation.
*/

Route::middleware('throttle:public-api')->group(function () {
    Route::get('settings', [ContentController::class, 'settings'])->name('settings');
    Route::get('menus/{location}', [ContentController::class, 'menu'])->name('menus.show');
    Route::get('pages/home/content', [ContentController::class, 'home'])->name('home');
    Route::get('pages/{slug}', [ContentController::class, 'page'])->where('slug', '[a-z0-9-]+')->name('pages.show');
    Route::get('faqs', [ContentController::class, 'faqs'])->name('faqs');
    Route::get('sitemap', [ContentController::class, 'sitemap'])->name('sitemap');

    Route::get('services', [CatalogController::class, 'services'])->name('services');
    Route::get('products', [CatalogController::class, 'products'])->name('products');
    Route::get('financing', [CatalogController::class, 'financing'])->name('financing.index');
    Route::get('financing/{id}', [CatalogController::class, 'financingShow'])->where('id', '[a-z0-9-]+')->name('financing.show');
    Route::get('cards', [CatalogController::class, 'cards'])->name('cards.index');
    Route::get('cards/{id}', [CatalogController::class, 'cardShow'])->where('id', '[a-z0-9-]+')->name('cards.show');
    Route::get('offers', [CatalogController::class, 'offers'])->name('offers');

    Route::get('news', [NewsController::class, 'index'])->name('news.index');
    Route::get('news/{slug}', [NewsController::class, 'show'])->where('slug', '[a-z0-9-]+')->name('news.show');
    Route::get('news-categories', [NewsController::class, 'categories'])->name('news-categories');

    Route::get('branches', [LocationController::class, 'branches'])->name('branches');
    Route::get('atms', [LocationController::class, 'atms'])->name('atms');
    Route::get('agents', [LocationController::class, 'agents'])->name('agents');
    Route::get('cities', [LocationController::class, 'cities'])->name('cities');

    Route::get('jobs', [JobController::class, 'index'])->name('jobs.index');
    Route::get('jobs/{slug}', [JobController::class, 'show'])->where('slug', '[a-z0-9-]+')->name('jobs.show');
});

Route::post('applications', [SubmissionController::class, 'application'])
    ->middleware(['throttle:forms', 'honeypot:application'])->name('forms.applications');
Route::post('contact', [SubmissionController::class, 'contact'])
    ->middleware(['throttle:forms', 'honeypot:CB'])->name('forms.contact');
Route::post('complaints', [SubmissionController::class, 'complaint'])
    ->middleware(['throttle:forms', 'honeypot:CMP'])->name('forms.complaints');
Route::post('jobs/{slug}/apply', [SubmissionController::class, 'jobApplication'])->where('slug', '[a-z0-9-]+')
    ->middleware(['throttle:forms', 'honeypot:JOB'])->name('forms.jobs');

Route::post('track', TrackController::class)->middleware('throttle:track')->name('track');

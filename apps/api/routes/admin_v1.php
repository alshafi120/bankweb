<?php

use App\Http\Controllers\Admin\ResourceController;
use App\Modules\Analytics\Http\Controllers\Admin\DashboardController;
use App\Modules\Applications\Http\Controllers\Admin\InboxController;
use App\Modules\Audit\Http\Controllers\Admin\AuditLogController;
use App\Modules\Content\Http\Controllers\Admin\PageController;
use App\Modules\Content\Http\Controllers\Admin\SeoController;
use App\Modules\Content\Http\Controllers\Admin\SettingsController;
use App\Modules\Identity\Http\Controllers\Admin\AccessController;
use App\Modules\Identity\Http\Controllers\Admin\AuthController;
use App\Modules\Media\Http\Controllers\Admin\MediaController;
use App\Modules\News\Http\Controllers\Admin\NewsWorkflowController;
use App\Support\Admin\ResourceRegistry;
use Illuminate\Support\Facades\Route;

/*
| Admin API — /api/admin/v1 (docs/API.md §2). Sanctum SPA cookie session (stateful only for
| SANCTUM_STATEFUL_DOMAINS), CSRF via X-XSRF-TOKEN, RBAC "<resource>.<ability>", audit on every write.
*/

Route::middleware(['admin.ip', 'no-store'])->group(function () {

    // ── Guest auth endpoints ───────────────────────────────────────────────
    Route::middleware('throttle:admin-auth')->prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login'])->name('auth.login');
        Route::post('two-factor-challenge', [AuthController::class, 'twoFactorChallenge'])->name('auth.two-factor-challenge');
        Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->name('auth.forgot-password');
        Route::post('reset-password', [AuthController::class, 'resetPassword'])->name('auth.reset-password');
    });

    Route::middleware(['auth:sanctum', 'admin.active', 'throttle:admin-api'])->group(function () {

        // ── Own account (reachable before mandatory 2FA enrolment) ─────────
        Route::prefix('auth')->group(function () {
            Route::post('logout', [AuthController::class, 'logout'])->name('auth.logout');
            Route::get('me', [AuthController::class, 'me'])->name('auth.me');
            Route::post('two-factor', [AuthController::class, 'enableTwoFactor'])->name('auth.two-factor.enable');
            Route::post('two-factor/confirm', [AuthController::class, 'confirmTwoFactor'])->name('auth.two-factor.confirm');
            Route::delete('two-factor', [AuthController::class, 'disableTwoFactor'])->name('auth.two-factor.disable');
            Route::put('password', [AuthController::class, 'changePassword'])->name('auth.password');
            Route::get('sessions', [AuthController::class, 'sessions'])->name('auth.sessions');
            Route::delete('sessions/{id}', [AuthController::class, 'revokeSession'])->where('id', '[a-f0-9]{64}')->name('auth.sessions.revoke');
        });

        Route::middleware('admin.2fa')->group(function () {
            Route::get('dashboard', DashboardController::class)->name('dashboard');

            // Pages (page builder) & news workflow
            Route::put('pages/{id}/sections', [PageController::class, 'sections'])->whereNumber('id')->name('pages.sections');
            Route::post('pages/{id}/publish', [PageController::class, 'publish'])->whereNumber('id')->name('pages.publish');
            Route::post('pages/{id}/schedule', [PageController::class, 'schedule'])->whereNumber('id')->name('pages.schedule');
            Route::post('news/{id}/submit', [NewsWorkflowController::class, 'submit'])->whereNumber('id')->name('news.submit');
            Route::post('news/{id}/approve', [NewsWorkflowController::class, 'approve'])->whereNumber('id')->name('news.approve');
            Route::post('news/{id}/reject', [NewsWorkflowController::class, 'reject'])->whereNumber('id')->name('news.reject');
            Route::post('news/{id}/publish', [NewsWorkflowController::class, 'publish'])->whereNumber('id')->name('news.publish');
            Route::post('news/{id}/schedule', [NewsWorkflowController::class, 'schedule'])->whereNumber('id')->name('news.schedule');

            // Users / roles / permissions
            Route::put('users/{id}/roles', [AccessController::class, 'setRoles'])->whereNumber('id')->name('users.roles');
            Route::post('users/{id}/unlock', [AccessController::class, 'unlock'])->whereNumber('id')->name('users.unlock');
            Route::put('roles/{id}/permissions', [AccessController::class, 'setPermissions'])->whereNumber('id')->name('roles.permissions');
            Route::get('permissions', [AccessController::class, 'permissions'])->name('permissions');

            // Media library
            Route::get('media', [MediaController::class, 'index'])->name('media.index');
            Route::post('media', [MediaController::class, 'store'])->name('media.store');
            Route::get('media/{id}', [MediaController::class, 'show'])->whereNumber('id')->name('media.show');
            Route::put('media/{id}', [MediaController::class, 'update'])->whereNumber('id')->name('media.update');
            Route::delete('media/{id}', [MediaController::class, 'destroy'])->whereNumber('id')->name('media.destroy');

            // Inbox: applications · contact-requests · complaints · job-applications
            $kinds = 'applications|contact-requests|complaints|job-applications';
            Route::get('{kind}/export', [InboxController::class, 'export'])->where('kind', $kinds)->name('inbox.export');
            Route::get('{kind}', [InboxController::class, 'index'])->where('kind', $kinds)->name('inbox.index');
            Route::get('{kind}/{id}', [InboxController::class, 'show'])->where('kind', $kinds)->whereNumber('id')->name('inbox.show');
            Route::patch('{kind}/{id}', [InboxController::class, 'update'])->where('kind', $kinds)->whereNumber('id')->name('inbox.update');
            Route::post('{kind}/{id}/notes', [InboxController::class, 'addNote'])->where('kind', $kinds)->whereNumber('id')->name('inbox.notes');
            Route::get('complaints/{id}/attachment', [InboxController::class, 'attachment'])->whereNumber('id')->name('complaints.attachment');
            Route::get('job-applications/{id}/cv', [InboxController::class, 'cv'])->whereNumber('id')->name('job-applications.cv');
            Route::get('files/{kind}/{id}', [InboxController::class, 'download'])->where('kind', 'complaints|job-applications')->whereNumber('id')
                ->middleware('signed:relative')->name('files.download');

            // Settings, SEO, audit
            Route::get('settings', [SettingsController::class, 'show'])->name('settings.show');
            Route::put('settings', [SettingsController::class, 'update'])->name('settings.update');
            Route::get('seo', [SeoController::class, 'index'])->name('seo.index');
            Route::post('seo', [SeoController::class, 'store'])->name('seo.store');
            Route::get('seo/{id}', [SeoController::class, 'show'])->whereNumber('id')->name('seo.show');
            Route::put('seo/{id}', [SeoController::class, 'update'])->whereNumber('id')->name('seo.update');
            Route::delete('seo/{id}', [SeoController::class, 'destroy'])->whereNumber('id')->name('seo.destroy');
            Route::get('audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');
            Route::get('audit-logs/{id}', [AuditLogController::class, 'show'])->whereNumber('id')->name('audit-logs.show');

            // Generic CRUD for every registered resource
            $resources = ResourceRegistry::pattern();
            Route::get('{resource}', [ResourceController::class, 'index'])->where('resource', $resources)->name('resources.index');
            Route::post('{resource}/bulk', [ResourceController::class, 'bulk'])->where('resource', $resources)->name('resources.bulk');
            Route::patch('{resource}/reorder', [ResourceController::class, 'reorder'])->where('resource', $resources)->name('resources.reorder');
            Route::post('{resource}', [ResourceController::class, 'store'])->where('resource', $resources)->name('resources.store');
            Route::get('{resource}/{id}', [ResourceController::class, 'show'])->where('resource', $resources)->whereNumber('id')->name('resources.show');
            Route::put('{resource}/{id}', [ResourceController::class, 'update'])->where('resource', $resources)->whereNumber('id')->name('resources.update');
            Route::delete('{resource}/{id}', [ResourceController::class, 'destroy'])->where('resource', $resources)->whereNumber('id')->name('resources.destroy');
        });
    });
});

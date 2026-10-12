<?php

namespace App\Providers;

use App\Modules\Applications\Infrastructure\Models\Application;
use App\Modules\Applications\Infrastructure\Models\Complaint;
use App\Modules\Applications\Infrastructure\Models\ContactRequest;
use App\Modules\Applications\Infrastructure\Models\JobApplication;
use App\Modules\Careers\Infrastructure\Models\Job;
use App\Modules\Catalog\Infrastructure\Models\Card;
use App\Modules\Catalog\Infrastructure\Models\FinancingProduct;
use App\Modules\Catalog\Infrastructure\Models\Offer;
use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Catalog\Infrastructure\Models\Service;
use App\Modules\Content\Infrastructure\Models\Banner;
use App\Modules\Content\Infrastructure\Models\Faq;
use App\Modules\Content\Infrastructure\Models\Page;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Network\Infrastructure\Models\Agent;
use App\Modules\Network\Infrastructure\Models\Atm;
use App\Modules\Network\Infrastructure\Models\Branch;
use App\Modules\News\Infrastructure\Models\News;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Mass-assignment protection: every model declares $fillable; fail loudly in dev/tests.
        Model::preventSilentlyDiscardingAttributes(! $this->app->isProduction());

        // Stable polymorphic type names (seo_metadata, application_notes) independent of class names.
        Relation::enforceMorphMap([
            'user' => User::class,
            'page' => Page::class,
            'news' => News::class,
            'service' => Service::class,
            'product' => Product::class,
            'financing_product' => FinancingProduct::class,
            'card' => Card::class,
            'offer' => Offer::class,
            'banner' => Banner::class,
            'faq' => Faq::class,
            'branch' => Branch::class,
            'atm' => Atm::class,
            'agent' => Agent::class,
            'job' => Job::class,
            'application' => Application::class,
            'contact_request' => ContactRequest::class,
            'complaint' => Complaint::class,
            'job_application' => JobApplication::class,
        ]);

        // Password policy (docs/API.md): ≥ 12, mixed case, numbers, symbols, not breached (production).
        Password::defaults(function () {
            $rule = Password::min(12)->mixedCase()->letters()->numbers()->symbols();

            return $this->app->isProduction() ? $rule->uncompromised() : $rule;
        });

        ResetPassword::createUrlUsing(fn (User $user, string $token) => rtrim((string) config('app.admin_url'), '/')
            .'/reset-password?token='.urlencode($token).'&email='.urlencode($user->email));

        $this->configureRateLimiting();
    }

    private function configureRateLimiting(): void
    {
        $tooMany = fn (Request $request, array $headers) => response()->json(['message' => 'Too many requests.'], 429, $headers);

        // Public read API (called by the Next.js server; generous).
        RateLimiter::for('public-api', fn (Request $request) => Limit::perMinute(300)->by('ip:'.$request->ip())->response($tooMany));

        // Public forms: 5/min and 30/day per IP per form (docs/API.md §1).
        RateLimiter::for('forms', function (Request $request) use ($tooMany) {
            $form = (string) ($request->route()?->getName() ?? $request->path());
            $key = $form.'|'.$request->ip();

            return [
                Limit::perMinute((int) config('bank.forms.per_minute', 5))->by('m|'.$key)->response($tooMany),
                Limit::perDay((int) config('bank.forms.per_day', 30))->by('d|'.$key)->response($tooMany),
            ];
        });

        RateLimiter::for('track', fn (Request $request) => Limit::perMinute(120)->by('track|'.$request->ip()));

        // Admin auth endpoints (per IP); the account lockout itself is per user (5 failures → 15 min).
        RateLimiter::for('admin-auth', fn (Request $request) => [
            Limit::perMinute(10)->by('auth|'.$request->ip())->response($tooMany),
            Limit::perHour(100)->by('auth-h|'.$request->ip())->response($tooMany),
        ]);

        RateLimiter::for('admin-api', fn (Request $request) => Limit::perMinute(240)->by('admin|'.($request->user()?->getAuthIdentifier() ?? $request->ip()))->response($tooMany));
    }
}

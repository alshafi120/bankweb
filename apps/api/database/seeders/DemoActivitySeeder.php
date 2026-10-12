<?php

namespace Database\Seeders;

use App\Modules\Analytics\Infrastructure\Models\PageView;
use App\Modules\Analytics\Infrastructure\Models\ServiceView;
use App\Modules\Applications\Application\Services\ReferenceGenerator;
use App\Modules\Applications\Infrastructure\Models\Application;
use App\Modules\Applications\Infrastructure\Models\Complaint;
use App\Modules\Applications\Infrastructure\Models\ContactRequest;
use App\Modules\Applications\Infrastructure\Models\JobApplication;
use App\Modules\Careers\Infrastructure\Models\Job;
use App\Modules\Catalog\Infrastructure\Models\Card;
use App\Modules\Catalog\Infrastructure\Models\FinancingProduct;
use App\Modules\Network\Infrastructure\Models\Branch;
use App\Support\Security\PiiHasher;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * LOCAL ONLY: ≈60 fictional applications + contact requests, complaints, job applications and 30 days of
 * page views so dashboard charts have data. Names/numbers are invented; IDs/phones are random.
 */
class DemoActivitySeeder extends Seeder
{
    private const FIRST = ['محمد', 'أحمد', 'فاطمة', 'عائشة', 'علي', 'خديجة', 'عبدالرحمن', 'مريم', 'صالح', 'نجلاء', 'ياسر', 'هالة', 'إبراهيم', 'سمية', 'حمزة', 'ريم'];

    private const LAST = ['الحميري', 'العولقي', 'باعباد', 'الشامي', 'المخلافي', 'الكبسي', 'بن بريك', 'العريقي', 'الصبري', 'اليافعي', 'القباطي', 'الأهدل'];

    private const CITIES = ['صنعاء', 'عدن', 'تعز', 'المكلا', 'مأرب', 'الحديدة', 'إب', 'سيئون'];

    private const STATUSES = ['new', 'new', 'new', 'in_review', 'in_review', 'contacted', 'approved', 'rejected', 'closed'];

    public function run(): void
    {
        if (! app()->environment('local', 'testing')) {
            throw new RuntimeException('DemoActivitySeeder only runs with APP_ENV=local.');
        }
        if (Application::query()->exists()) {
            $this->command?->warn('Demo applications already present — skipped.');

            return;
        }
        mt_srand(20261006);

        $refs = app(ReferenceGenerator::class);
        $branches = Branch::query()->pluck('id')->all();
        $financing = FinancingProduct::query()->get(['id', 'max_amount', 'max_months']);
        $cards = Card::query()->pluck('id')->all();
        $jobs = Job::query()->pluck('id')->all();

        DB::transaction(function () use ($refs, $branches, $financing, $cards, $jobs) {
            $types = ['account', 'account', 'financing', 'financing', 'financing', 'card', 'card'];
            for ($i = 0; $i < 62; $i++) {
                $type = $types[$i % 7];
                $at = $this->when();
                $app = new Application([
                    'reference' => $refs->next(match ($type) { 'account' => 'ACC', 'financing' => 'FIN', default => 'CRD' }),
                    'type' => $type, 'status' => $this->status($at), 'full_name' => $this->name(),
                    'national_id' => $this->digits(10), 'phone' => $this->phone(), 'email' => mt_rand(0, 9) > 3 ? 'client'.($i + 1).'@mail.example' : null,
                    'city' => $this->pick(self::CITIES), 'locale' => mt_rand(0, 9) > 1 ? 'ar' : 'en',
                    'account_type' => $type === 'account' ? $this->pick(['current', 'savings', 'investment', 'business']) : null,
                    'branch_id' => $type === 'account' && $branches ? $this->pick($branches) : null,
                    'ip_hash' => PiiHasher::ip('10.0.'.mt_rand(0, 255).'.'.mt_rand(1, 254)), 'user_agent' => 'Mozilla/5.0 (demo)', 'submitted_at' => $at,
                ]);
                $app->forceFill(['created_at' => $at, 'updated_at' => $at])->save();

                if ($type === 'financing' && $financing->isNotEmpty()) {
                    $p = $financing->random();
                    $app->financingRequest()->create([
                        'financing_product_id' => $p->id, 'amount' => min($p->max_amount, mt_rand(5, 200) * 100_000),
                        'months' => min($p->max_months, $this->pick([12, 24, 36, 48])), 'monthly_income' => mt_rand(15, 90) * 10_000,
                        'employer' => $this->pick(['قطاع خاص', 'حكومي', 'عمل حر']),
                    ]);
                }
                if ($type === 'card' && $cards) {
                    $has = mt_rand(0, 9) > 2;
                    $app->cardRequest()->create(['card_id' => $this->pick($cards), 'has_account' => $has, 'account_last4' => $has ? $this->digits(4) : null]);
                }
            }

            for ($i = 0; $i < 18; $i++) {
                $at = $this->when();
                (new ContactRequest([
                    'reference' => $refs->next('CB'), 'status' => $this->status($at), 'full_name' => $this->name(), 'phone' => $this->phone(),
                    'subject' => $this->pick(['general', 'accounts', 'financing', 'cards', 'digital']),
                    'message' => 'أرغب في معرفة تفاصيل أكثر عن الخدمة وطريقة التقديم، وشكراً.', 'preferred_time' => $this->pick(['morning', 'afternoon', 'evening']),
                    'locale' => 'ar', 'ip_hash' => PiiHasher::ip('10.1.0.'.$i),
                ]))->forceFill(['created_at' => $at, 'updated_at' => $at])->save();
            }

            for ($i = 0; $i < 16; $i++) {
                $at = $this->when();
                (new Complaint([
                    'reference' => $refs->next('CMP'), 'status' => $this->status($at), 'full_name' => $this->name(), 'phone' => $this->phone(),
                    'national_id' => mt_rand(0, 1) ? $this->digits(10) : null,
                    'category' => $this->pick(['service', 'transaction', 'staff', 'digital', 'fees']),
                    'branch_id' => $branches ? $this->pick($branches) : null, 'transaction_date' => $at->copy()->subDays(mt_rand(1, 10))->toDateString(),
                    'description' => 'تأخر تنفيذ حوالة لأكثر من يومين دون إشعار، أرجو المتابعة.', 'locale' => 'ar', 'ip_hash' => PiiHasher::ip('10.2.0.'.$i),
                ]))->forceFill(['created_at' => $at, 'updated_at' => $at])->save();
            }

            if ($jobs) {
                $cv = 'cvs/demo/sample-cv.pdf';
                Storage::disk('private')->put($cv, "%PDF-1.4\n% Demo CV — fictional\n%%EOF\n");
                for ($i = 0; $i < 14; $i++) {
                    $at = $this->when();
                    (new JobApplication([
                        'reference' => $refs->next('JOB'), 'job_id' => $this->pick($jobs), 'status' => $this->status($at), 'full_name' => $this->name(),
                        'phone' => $this->phone(), 'email' => 'candidate'.($i + 1).'@mail.example', 'city' => $this->pick(self::CITIES),
                        'education' => $this->pick(['بكالوريوس محاسبة', 'بكالوريوس تقنية معلومات', 'ماجستير إدارة أعمال']),
                        'experience_years' => mt_rand(0, 12), 'cover_letter' => 'أتطلع للانضمام إلى فريقكم.', 'cv_path' => $cv, 'locale' => 'ar',
                        'ip_hash' => PiiHasher::ip('10.3.0.'.$i),
                    ]))->forceFill(['created_at' => $at, 'updated_at' => $at])->save();
                }
            }

            $this->analytics();
        });
    }

    private function analytics(): void
    {
        $paths = ['/ar', '/en', '/ar/financing', '/ar/accounts', '/ar/cards', '/ar/branches', '/ar/news', '/ar/apply/account',
            '/ar/apply/financing', '/ar/digital', '/en/financing', '/ar/offers', '/ar/careers', '/ar/transfers', '/ar/contact'];
        $sources = [[null, 'direct'], ['www.google.com', 'search'], ['www.google.com', 'search'], ['m.facebook.com', 'social'], ['t.co', 'social'], ['news.example.ye', 'referral']];
        $rows = [];
        $services = [];
        for ($day = 29; $day >= 0; $day--) {
            $date = Carbon::today()->subDays($day)->toDateString();
            $n = 60 + (int) (40 * sin($day / 4)) + mt_rand(0, 40);
            for ($k = 0; $k < $n; $k++) {
                $path = $this->pick($paths);
                [$host, $source] = $this->pick($sources);
                $rows[] = ['date' => $date, 'path' => $path, 'referrer_host' => $host, 'source' => $source, 'visitor_hash' => hash('sha256', $date.'|v'.mt_rand(1, (int) ($n * 0.7)))];
                $seg = explode('/', trim($path, '/'))[1] ?? null;
                if ($seg && in_array($seg, ['financing', 'accounts', 'cards', 'branches', 'digital', 'offers', 'transfers', 'apply'], true)) {
                    $services[$date][$seg] = ($services[$date][$seg] ?? 0) + 1;
                }
            }
        }
        foreach (array_chunk($rows, 500) as $chunk) {
            PageView::query()->insert($chunk);
        }
        foreach ($services as $date => $byKey) {
            foreach ($byKey as $key => $count) {
                ServiceView::query()->create(['date' => $date, 'service_key' => $key, 'count' => $count]);
            }
        }
    }

    private function when(): Carbon
    {
        return now()->subDays(mt_rand(0, 29))->subSeconds(mt_rand(0, 86000));
    }

    private function status(Carbon $at): string
    {
        return $at->gt(now()->subDays(2)) ? 'new' : $this->pick(self::STATUSES);
    }

    private function name(): string
    {
        return $this->pick(self::FIRST).' '.$this->pick(self::FIRST).' '.$this->pick(self::LAST);
    }

    private function phone(): string
    {
        return '9677'.$this->pick(['1', '3', '7', '8']).$this->digits(7);
    }

    private function digits(int $n): string
    {
        $s = (string) mt_rand(1, 9);
        while (strlen($s) < $n) {
            $s .= mt_rand(0, 9);
        }

        return $s;
    }

    private function pick(array $items): mixed
    {
        return $items[mt_rand(0, count($items) - 1)];
    }
}

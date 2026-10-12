<?php

namespace App\Modules\Applications\Application\Services;

use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Human-readable, sequential references: WTQ-{ACC|FIN|CRD|CB|CMP|JOB}-{YYYY}-{000001}.
 * One counter per prefix and year in `reference_sequences`, incremented under a row lock
 * (SELECT … FOR UPDATE) inside a transaction → unique and gap-free under concurrency.
 */
class ReferenceGenerator
{
    public const PREFIXES = ['ACC', 'FIN', 'CRD', 'CB', 'CMP', 'JOB'];

    public function next(string $prefix, ?int $year = null): string
    {
        $prefix = strtoupper($prefix);
        if (! in_array($prefix, self::PREFIXES, true)) {
            throw new InvalidArgumentException("Unknown reference prefix [{$prefix}].");
        }
        $year ??= (int) now()->format('Y');

        $value = DB::transaction(function () use ($prefix, $year) {
            $row = DB::table('reference_sequences')->where('prefix', $prefix)->where('year', $year)->lockForUpdate()->first();

            if ($row === null) {
                // insertOrIgnore handles two first-requests racing on a new year; then re-read under lock.
                DB::table('reference_sequences')->insertOrIgnore([
                    'prefix' => $prefix, 'year' => $year, 'last_value' => 0, 'created_at' => now(), 'updated_at' => now(),
                ]);
                $row = DB::table('reference_sequences')->where('prefix', $prefix)->where('year', $year)->lockForUpdate()->first();
            }

            $next = (int) $row->last_value + 1;
            DB::table('reference_sequences')->where('prefix', $prefix)->where('year', $year)
                ->update(['last_value' => $next, 'updated_at' => now()]);

            return $next;
        }, 3);

        return self::format($prefix, $year, $value);
    }

    public static function format(string $prefix, int $year, int $value): string
    {
        return sprintf('%s-%s-%04d-%06d', config('bank.reference_prefix', 'WTQ'), $prefix, $year, $value);
    }

    /** Plausible reference for honeypot hits (never stored, never sequential with real ones). */
    public static function fake(string $prefix): string
    {
        $prefix = in_array(strtoupper($prefix), self::PREFIXES, true) ? strtoupper($prefix) : 'ACC';

        return self::format($prefix, (int) now()->format('Y'), random_int(100000, 999999));
    }

    public static function prefixForApplicationType(string $type): string
    {
        return match ($type) {
            'financing' => 'FIN',
            'card' => 'CRD',
            default => 'ACC',
        };
    }
}

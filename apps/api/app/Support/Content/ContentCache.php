<?php

namespace App\Support\Content;

use App\Jobs\RevalidateFrontend;
use Closure;
use Illuminate\Support\Facades\Cache;

/**
 * Public read cache with key versioning: every key is `content:v{n}:…`; any content change bumps n,
 * so all cached public responses are invalidated at once without needing cache tags
 * (works on file/database/redis stores alike). Old keys simply expire.
 */
final class ContentCache
{
    private const VERSION_KEY = 'content:version';

    private static bool $muted = false;

    public static function version(): int
    {
        return (int) Cache::get(self::VERSION_KEY, 1);
    }

    public static function key(string $key): string
    {
        return 'content:v'.self::version().':'.$key;
    }

    /**
     * @template T
     *
     * @param  Closure(): T  $callback
     * @return T
     */
    public static function remember(string $key, Closure $callback): mixed
    {
        return Cache::remember(self::key($key), (int) config('bank.cache.ttl', 300), $callback);
    }

    public static function bump(): void
    {
        Cache::forever(self::VERSION_KEY, self::version() + 1);
    }

    /**
     * Called by model observers on any content change: invalidate the API cache and ask the
     * Next.js site to revalidate the affected ISR tags/paths (queued, after commit).
     *
     * @param  list<string>  $tags
     * @param  list<string>  $paths
     */
    public static function changed(array $tags = [], array $paths = []): void
    {
        if (self::$muted) {
            return;
        }
        self::bump();

        if (filled(config('services.frontend_revalidate.url')) && filled(config('services.frontend_revalidate.secret'))
            && ($tags !== [] || $paths !== [])) {
            RevalidateFrontend::dispatch(array_values(array_unique($tags)), array_values(array_unique($paths)))->afterCommit();
        }
    }

    /** Run a bulk operation (seeding, imports) with a single bump at the end. */
    public static function muted(callable $callback): mixed
    {
        $previous = self::$muted;
        self::$muted = true;
        try {
            return $callback();
        } finally {
            self::$muted = $previous;
            if (! $previous) {
                self::bump();
            }
        }
    }
}

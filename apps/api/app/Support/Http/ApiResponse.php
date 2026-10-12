<?php

namespace App\Support\Http;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;

/** Envelope helpers: `{ data }` and `{ data, meta: { currentPage, lastPage, perPage, total } }`. */
final class ApiResponse
{
    public static function data(mixed $data, int $status = 200, array $headers = []): JsonResponse
    {
        return response()->json(['data' => $data], $status, $headers, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public static function created(mixed $data): JsonResponse
    {
        return self::data($data, 201);
    }

    /** @param  callable(mixed): array  $map */
    public static function paginated(LengthAwarePaginator $page, callable $map, array $headers = []): JsonResponse
    {
        return response()->json([
            'data' => array_map($map, $page->items()),
            'meta' => self::meta($page),
        ], 200, $headers, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    /** @return array{currentPage: int, lastPage: int, perPage: int, total: int} */
    public static function meta(LengthAwarePaginator $page): array
    {
        return [
            'currentPage' => $page->currentPage(),
            'lastPage' => $page->lastPage(),
            'perPage' => $page->perPage(),
            'total' => $page->total(),
        ];
    }

    public static function noContent(): JsonResponse
    {
        return response()->json(null, 204);
    }

    /** Public, cacheable (ISR on the Next.js side; Cloudflare may cache too). */
    public static function publicCache(): array
    {
        $ttl = (int) config('bank.cache.ttl', 300);

        return ['Cache-Control' => "public, max-age=60, s-maxage={$ttl}"];
    }
}

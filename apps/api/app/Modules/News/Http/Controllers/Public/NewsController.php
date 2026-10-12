<?php

namespace App\Modules\News\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Modules\Content\Application\Services\PublicContentQuery;
use App\Support\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** GET /news?category=&page=&perPage= · /news/{slug} · /news-categories (published, publishedAt ≤ now) */
class NewsController extends Controller
{
    public function __construct(private readonly PublicContentQuery $query) {}

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category' => ['nullable', 'string', 'max:80', 'regex:/^[a-z0-9-]+$/'],
            'page' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'perPage' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $result = $this->query->newsPage(
            $validated['category'] ?? null,
            (int) ($validated['page'] ?? 1),
            (int) ($validated['perPage'] ?? 12),
        );

        return response()->json($result, 200, ApiResponse::publicCache(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public function show(string $slug): JsonResponse
    {
        $item = $this->query->newsDetail($slug);
        abort_if($item === null, 404);

        return ApiResponse::data($item, headers: ApiResponse::publicCache());
    }

    public function categories(): JsonResponse
    {
        return ApiResponse::data($this->query->newsCategories(), headers: ApiResponse::publicCache());
    }
}

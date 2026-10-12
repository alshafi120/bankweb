<?php

namespace App\Modules\Content\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Modules\Content\Application\Services\PublicContentQuery;
use App\Support\Http\ApiResponse;
use Illuminate\Http\JsonResponse;

/** GET /settings · /menus/{location} · /pages/home/content · /pages/{slug} · /faqs · /sitemap */
class ContentController extends Controller
{
    public function __construct(private readonly PublicContentQuery $query) {}

    public function settings(): JsonResponse
    {
        return ApiResponse::data($this->query->settings(), headers: ApiResponse::publicCache());
    }

    public function menu(string $location): JsonResponse
    {
        abort_unless(in_array($location, ['header', 'footer'], true), 404);

        return ApiResponse::data($this->query->menu($location), headers: ApiResponse::publicCache());
    }

    public function home(): JsonResponse
    {
        return ApiResponse::data($this->query->home(), headers: ApiResponse::publicCache());
    }

    public function page(string $slug): JsonResponse
    {
        $page = $this->query->page($slug);
        abort_if($page === null, 404);

        return ApiResponse::data($page, headers: ApiResponse::publicCache());
    }

    public function faqs(): JsonResponse
    {
        return ApiResponse::data($this->query->faqGroups(), headers: ApiResponse::publicCache());
    }

    public function sitemap(): JsonResponse
    {
        return ApiResponse::data($this->query->sitemap(), headers: ApiResponse::publicCache());
    }
}

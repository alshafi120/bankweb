<?php

namespace App\Modules\Catalog\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Modules\Content\Application\Services\PublicContentQuery;
use App\Support\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** GET /services · /products?type= · /financing[/{id}] · /cards[/{id}] · /offers */
class CatalogController extends Controller
{
    public function __construct(private readonly PublicContentQuery $query) {}

    public function services(): JsonResponse
    {
        return ApiResponse::data($this->query->services(), headers: ApiResponse::publicCache());
    }

    public function products(Request $request): JsonResponse
    {
        $type = $request->query('type');
        $type = is_string($type) && in_array($type, ['account', 'current', 'savings', 'investment', 'business'], true) ? $type : null;

        return ApiResponse::data($this->query->accounts($type), headers: ApiResponse::publicCache());
    }

    public function financing(): JsonResponse
    {
        return ApiResponse::data($this->query->financing(), headers: ApiResponse::publicCache());
    }

    public function financingShow(string $id): JsonResponse
    {
        $item = $this->query->financingOne($id);
        abort_if($item === null, 404);

        return ApiResponse::data($item, headers: ApiResponse::publicCache());
    }

    public function cards(): JsonResponse
    {
        return ApiResponse::data($this->query->cards(), headers: ApiResponse::publicCache());
    }

    public function cardShow(string $id): JsonResponse
    {
        $item = $this->query->card($id);
        abort_if($item === null, 404);

        return ApiResponse::data($item, headers: ApiResponse::publicCache());
    }

    public function offers(): JsonResponse
    {
        return ApiResponse::data($this->query->offers(), headers: ApiResponse::publicCache());
    }
}

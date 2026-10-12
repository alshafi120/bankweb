<?php

namespace App\Modules\Network\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Modules\Content\Application\Services\PublicContentQuery;
use App\Modules\Network\Infrastructure\Models\Agent;
use App\Modules\Network\Infrastructure\Models\Atm;
use App\Modules\Network\Infrastructure\Models\Branch;
use App\Support\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** GET /branches?city=&q= · /atms · /agents → Location[] · GET /cities */
class LocationController extends Controller
{
    public function __construct(private readonly PublicContentQuery $query) {}

    public function branches(Request $request): JsonResponse
    {
        return $this->list(Branch::class, $request);
    }

    public function atms(Request $request): JsonResponse
    {
        return $this->list(Atm::class, $request);
    }

    public function agents(Request $request): JsonResponse
    {
        return $this->list(Agent::class, $request);
    }

    /** GET /cities → {id, slug, name}[] */
    public function cities(): JsonResponse
    {
        return ApiResponse::data($this->query->cities(), headers: ApiResponse::publicCache());
    }

    /** @param  class-string<Branch|Atm|Agent>  $model */
    private function list(string $model, Request $request): JsonResponse
    {
        $v = $request->validate([
            'city' => ['nullable', 'string', 'max:80'],
            'q' => ['nullable', 'string', 'max:80'],
        ]);

        return ApiResponse::data(
            $this->query->locations($model, $v['city'] ?? null, isset($v['q']) ? trim($v['q']) : null),
            headers: ApiResponse::publicCache(),
        );
    }
}

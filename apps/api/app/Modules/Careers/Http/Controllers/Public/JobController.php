<?php

namespace App\Modules\Careers\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Modules\Content\Application\Services\PublicContentQuery;
use App\Support\Http\ApiResponse;
use Illuminate\Http\JsonResponse;

/** GET /jobs (open only) · /jobs/{slug} */
class JobController extends Controller
{
    public function __construct(private readonly PublicContentQuery $query) {}

    public function index(): JsonResponse
    {
        return ApiResponse::data($this->query->jobs(), headers: ApiResponse::publicCache());
    }

    public function show(string $slug): JsonResponse
    {
        $job = $this->query->job($slug);
        abort_if($job === null, 404);

        return ApiResponse::data($job, headers: ApiResponse::publicCache());
    }
}

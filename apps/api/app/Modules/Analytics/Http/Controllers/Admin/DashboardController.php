<?php

namespace App\Modules\Analytics\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Modules\Analytics\Application\Services\DashboardQuery;
use App\Support\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** GET /dashboard → `DashboardData`. */
class DashboardController extends Controller
{
    public function __invoke(Request $request, DashboardQuery $query): JsonResponse
    {
        abort_unless($request->user()->can('dashboard.view'), 403, 'Forbidden.');

        return ApiResponse::data($query->get());
    }
}

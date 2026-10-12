<?php

namespace App\Modules\Audit\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Modules\Audit\Infrastructure\Models\AuditLog;
use App\Support\Admin\ListQuery;
use App\Support\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** GET /audit-logs (read-only) — filter[userId] filter[action] filter[resourceType] filter[resourceId] filter[from] filter[to]. */
class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('audit-logs.view'), 403, 'Forbidden.');
        $list = ListQuery::fromRequest($request);

        $query = $list->apply(AuditLog::query()->with('user:id,name'), ['resource_label', 'action', 'resource_type'], [
            'userId' => 'user_id',
            'action' => 'action',
            'resourceType' => 'resource_type',
            'resourceId' => 'resource_id',
            'from' => fn ($q, $v) => $q->where('created_at', '>=', \Illuminate\Support\Carbon::parse($v)->startOfDay()),
            'to' => fn ($q, $v) => $q->where('created_at', '<=', \Illuminate\Support\Carbon::parse($v)->endOfDay()),
        ], ['createdAt' => 'created_at', 'id' => 'id'], '-createdAt', false);

        return ApiResponse::paginated($list->paginate($query), fn (AuditLog $log) => self::present($log));
    }

    public function show(Request $request, int $id): JsonResponse
    {
        abort_unless($request->user()->can('audit-logs.view'), 403, 'Forbidden.');

        return ApiResponse::data(self::present(AuditLog::query()->with('user:id,name')->findOrFail($id)));
    }

    /** Contract `AuditLogEntry`. */
    public static function present(AuditLog $log): array
    {
        return [
            'id' => $log->id,
            'user' => $log->user ? ['id' => $log->user->id, 'name' => $log->user->name] : null,
            'action' => $log->action,
            'resourceType' => $log->resource_type,
            'resourceId' => $log->resource_id,
            'resourceLabel' => $log->resource_label,
            'changes' => $log->changes,
            'ipAddress' => (string) $log->ip_address,
            'userAgent' => (string) $log->user_agent,
            'createdAt' => $log->created_at?->toIso8601String(),
        ];
    }
}

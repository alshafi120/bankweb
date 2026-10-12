<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Modules\Audit\Application\Services\AuditLogger;
use App\Modules\Audit\Domain\Enums\AuditAction;
use App\Support\Admin\AdminResource;
use App\Support\Admin\ListQuery;
use App\Support\Admin\ResourceRegistry;
use App\Support\Http\ApiResponse;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Generic CRUD for every registered admin resource:
 *   GET /{r} · POST /{r} · GET /{r}/{id} · PUT /{r}/{id} · DELETE /{r}/{id} · POST /{r}/bulk · PATCH /{r}/reorder
 * Authorization: "<resource>.<ability>" (Gate). Changing `status` additionally needs `<resource>.publish`
 * where the resource has a publish ability (separation of duties). Every write is audited by the
 * model observer (Auditable); bulk publish is audited explicitly.
 */
class ResourceController extends Controller
{
    public function __construct(private readonly ResourceRegistry $registry, private readonly AuditLogger $audit) {}

    public function index(Request $request): JsonResponse
    {
        $resource = $this->resource($request);
        $this->authorizeAbility($request, $resource, 'view');

        $list = ListQuery::fromRequest($request);
        $query = $list->apply($resource->query(), $resource->searchable(), $resource->filters(), $resource->sorts(), $resource->defaultSort(), $resource->hasStatus());

        return ApiResponse::paginated($list->paginate($query), fn (Model $m) => $resource->present($m));
    }

    public function show(Request $request, string $resource, string $id): JsonResponse
    {
        $resource = $this->resource($request);
        $this->authorizeAbility($request, $resource, 'view');

        return ApiResponse::data($resource->present($this->find($resource, $id)));
    }

    public function store(Request $request): JsonResponse
    {
        $resource = $this->resource($request);
        $this->authorizeAbility($request, $resource, 'create');
        $data = $request->validate($resource->rules(true, null));
        $this->authorizeStatusChange($request, $resource, $data, null);

        $model = DB::transaction(function () use ($resource, $data, $request) {
            $class = $resource->model();
            $model = new $class;
            if ($resource->hasStatus() && ! array_key_exists('status', $data)) {
                $model->setAttribute('status', in_array('draft', $resource->statuses(), true) ? 'draft' : 'inactive');
            }
            $resource->fill($model, $data, $request->user(), true);
            $model->save();
            $resource->afterSave($model, $data, $request->user(), true);

            return $model;
        });

        return ApiResponse::created($resource->present($model->refresh()));
    }

    public function update(Request $request, string $resource, string $id): JsonResponse
    {
        $resource = $this->resource($request);
        $this->authorizeAbility($request, $resource, 'update');
        $model = $this->find($resource, $id);
        $data = $request->validate($resource->rules(false, $model));
        $this->authorizeStatusChange($request, $resource, $data, $model);

        DB::transaction(function () use ($resource, $model, $data, $request) {
            $resource->fill($model, $data, $request->user(), false);
            $model->save();
            $resource->afterSave($model, $data, $request->user(), false);
        });

        return ApiResponse::data($resource->present($model->refresh()));
    }

    public function destroy(Request $request, string $resource, string $id): JsonResponse
    {
        $resource = $this->resource($request);
        $this->authorizeAbility($request, $resource, 'delete');
        $model = $this->find($resource, $id);

        if ($reason = $resource->deleteBlockedReason($model, $request->user())) {
            return response()->json(['message' => $reason], 422);
        }
        $model->delete();

        return ApiResponse::noContent();
    }

    public function bulk(Request $request): JsonResponse
    {
        $resource = $this->resource($request);
        $data = $request->validate([
            'action' => ['required', 'in:delete,publish,unpublish,archive,activate,deactivate'],
            'ids' => ['required', 'array', 'min:1', 'max:200'],
            'ids.*' => ['integer', 'min:1'],
        ]);

        $action = $data['action'];
        $status = $action === 'delete' ? null : $resource->bulkStatus($action);
        if ($action !== 'delete' && ($status === null || ! $resource->hasStatus())) {
            return response()->json(['message' => 'This action is not available for this resource.', 'errors' => ['action' => ['Unsupported action.']]], 422);
        }
        $this->authorizeAbility($request, $resource, $action === 'delete' ? 'delete' : $resource->statusAbility());

        $affected = 0;
        DB::transaction(function () use ($resource, $data, $action, $status, $request, &$affected) {
            $models = $resource->query()->whereKey($data['ids'])->get();
            foreach ($models as $model) {
                if ($action === 'delete') {
                    if ($resource->deleteBlockedReason($model, $request->user()) !== null) {
                        continue;
                    }
                    $model->delete();
                } else {
                    if ($model->getAttribute('status') === $status) {
                        continue;
                    }
                    $model->setAttribute('status', $status);
                    if ($status === 'published' && in_array('draft', $resource->statuses(), true)) {
                        $model->setAttribute('published_at', $model->getAttribute('published_at') ?? now());
                    }
                    $model->save();
                    if ($action === 'publish') {
                        $this->audit->log(AuditAction::Publish, $model);
                    }
                }
                $affected++;
            }
        });

        return ApiResponse::data(['affected' => $affected]);
    }

    public function reorder(Request $request): JsonResponse
    {
        $resource = $this->resource($request);
        abort_unless($resource->hasPosition(), 404);
        $this->authorizeAbility($request, $resource, 'update');
        $data = $request->validate(['ids' => ['required', 'array', 'min:1', 'max:500'], 'ids.*' => ['integer', 'distinct', 'min:1']]);

        DB::transaction(function () use ($resource, $data) {
            $models = $resource->query()->whereKey($data['ids'])->get()->keyBy(fn (Model $m) => $m->getKey());
            foreach (array_values($data['ids']) as $index => $id) {
                if ($model = $models->get($id)) {
                    $model->setAttribute('position', $index + 1);
                    $model->save();
                }
            }
        });

        return ApiResponse::noContent();
    }

    private function resource(Request $request): AdminResource
    {
        return $this->registry->get((string) $request->route('resource'));
    }

    private function find(AdminResource $resource, string $id): Model
    {
        abort_unless(ctype_digit($id), 404);

        return $resource->query()->findOrFail((int) $id);
    }

    private function authorizeAbility(Request $request, AdminResource $resource, string $ability): void
    {
        abort_unless($resource->can($request->user(), $ability), 403, 'Forbidden.');
    }

    private function authorizeStatusChange(Request $request, AdminResource $resource, array $data, ?Model $model): void
    {
        if (! array_key_exists('status', $data) || $resource->statusAbility() === 'update') {
            return;
        }
        $from = $model?->getAttribute('status');
        if ($from === $data['status']) {
            return;
        }
        abort_unless($resource->can($request->user(), $resource->statusAbility()), 403, 'You are not allowed to change the publication status.');
    }
}

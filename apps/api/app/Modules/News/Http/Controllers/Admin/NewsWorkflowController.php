<?php

namespace App\Modules\News\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Modules\News\Application\Actions\NewsWorkflow;
use App\Modules\News\Http\Resources\NewsAdminResource;
use App\Modules\News\Infrastructure\Models\News;
use App\Support\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/** POST /news/{id}/submit · /approve · /reject {reason} · /publish · /schedule {publishAt} */
class NewsWorkflowController extends Controller
{
    public function __construct(private readonly NewsWorkflow $workflow, private readonly NewsAdminResource $resource) {}

    public function submit(Request $request, int $id): JsonResponse
    {
        return $this->respond($this->workflow->submit($this->find($id), $request->user()));
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        return $this->respond($this->workflow->approve($this->find($id), $request->user()));
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'min:3', 'max:2000']]);

        return $this->respond($this->workflow->reject($this->find($id), $request->user(), strip_tags($data['reason'])));
    }

    public function publish(Request $request, int $id): JsonResponse
    {
        return $this->respond($this->workflow->publish($this->find($id), $request->user()));
    }

    public function schedule(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['publishAt' => ['required', 'date', 'after:now']]);

        return $this->respond($this->workflow->schedule($this->find($id), $request->user(), Carbon::parse($data['publishAt'])));
    }

    private function find(int $id): News
    {
        return News::query()->with($this->resource->with())->findOrFail($id);
    }

    private function respond(News $news): JsonResponse
    {
        return ApiResponse::data($this->resource->present($news->refresh()->load($this->resource->with())));
    }
}

<?php

namespace App\Modules\Content\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Modules\Content\Infrastructure\Models\SeoMetadata;
use App\Modules\Media\Infrastructure\Models\Media;
use App\Support\Admin\AdminResource;
use App\Support\Admin\ListQuery;
use App\Support\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * SEO for static routes (`seo_metadata.path`). Entity SEO lives inside each resource (`seo` field).
 * GET /seo?filter[path]= · POST /seo · GET/PUT/DELETE /seo/{id}
 */
class SeoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('seo.view'), 403, 'Forbidden.');
        $list = ListQuery::fromRequest($request);
        $query = SeoMetadata::query()->with('ogImage')->whereNotNull('path');
        $query = $list->apply($query, ['path', 'title_ar', 'title_en'], [
            'path' => fn ($q, $v) => $q->where('path', 'like', addcslashes($v, '%_\\').'%'),
        ], ['path' => 'path', 'updatedAt' => 'updated_at', 'id' => 'id'], 'path', false);

        return ApiResponse::paginated($list->paginate($query), fn (SeoMetadata $s) => $this->present($s));
    }

    public function show(Request $request, int $id): JsonResponse
    {
        abort_unless($request->user()->can('seo.view'), 403, 'Forbidden.');

        return ApiResponse::data($this->present(SeoMetadata::query()->findOrFail($id)));
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('seo.create'), 403, 'Forbidden.');
        $data = $request->validate($this->rules(null));
        $seo = new SeoMetadata(['path' => $data['path']]);
        $this->fill($seo, $data)->save();

        return ApiResponse::created($this->present($seo));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        abort_unless($request->user()->can('seo.update'), 403, 'Forbidden.');
        $seo = SeoMetadata::query()->findOrFail($id);
        $data = $request->validate($this->rules($seo));
        $this->fill($seo, $data)->save();

        return ApiResponse::data($this->present($seo->refresh()));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        abort_unless($request->user()->can('seo.delete'), 403, 'Forbidden.');
        SeoMetadata::query()->whereNotNull('path')->findOrFail($id)->delete();

        return ApiResponse::noContent();
    }

    private function rules(?SeoMetadata $seo): array
    {
        $rules = AdminResource::seoRules('seo');
        unset($rules['seo']);
        $flat = [];
        foreach ($rules as $k => $v) {
            $flat[substr($k, 4)] = $v;
        }

        return [
            'path' => [$seo ? 'sometimes' : 'required', 'string', 'max:255', 'regex:#^/[a-z0-9/_-]*$#i', Rule::unique('seo_metadata', 'path')->ignore($seo?->id)],
            ...$flat,
        ];
    }

    private function fill(SeoMetadata $seo, array $d): SeoMetadata
    {
        $og = $d['ogImage']['id'] ?? null;

        return $seo->fill(array_filter([
            'path' => $d['path'] ?? null,
            'title_ar' => $d['title']['ar'] ?? null,
            'title_en' => $d['title']['en'] ?? null,
            'description_ar' => $d['description']['ar'] ?? null,
            'description_en' => $d['description']['en'] ?? null,
            'keywords_ar' => $d['keywords']['ar'] ?? null,
            'keywords_en' => $d['keywords']['en'] ?? null,
            'canonical' => $d['canonical'] ?? null,
        ], fn ($v) => $v !== null) + [
            'og_media_id' => array_key_exists('ogImage', $d) ? ($og && Media::query()->whereKey($og)->exists() ? (int) $og : null) : $seo->og_media_id,
            'noindex' => (bool) ($d['noindex'] ?? $seo->noindex ?? false),
        ]);
    }

    private function present(SeoMetadata $s): array
    {
        return ['id' => $s->id, 'path' => $s->path] + $s->toContract() + ['updatedAt' => $s->updated_at?->toIso8601String()];
    }
}

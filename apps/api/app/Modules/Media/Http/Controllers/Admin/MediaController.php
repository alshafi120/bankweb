<?php

namespace App\Modules\Media\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Modules\Media\Application\Services\SecureUploadService;
use App\Modules\Media\Infrastructure\Models\Media;
use App\Support\Admin\ListQuery;
use App\Support\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/** GET /media?kind= · POST /media (multipart file, alt[ar], alt[en]) · GET/PUT/DELETE /media/{id} */
class MediaController extends Controller
{
    private const MAX_BYTES = 20 * 1024 * 1024;

    public function __construct(private readonly SecureUploadService $uploads) {}

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('media.view'), 403, 'Forbidden.');
        $list = ListQuery::fromRequest($request);
        $kind = $request->query('kind');

        $query = Media::query()->with('uploader')
            ->when(is_string($kind) && in_array($kind, ['image', 'video', 'pdf', 'document'], true), fn ($q) => $q->where('kind', $kind));
        $query = $list->apply($query, ['original_name', 'alt_ar', 'alt_en'], ['kind' => 'kind', 'mime' => 'mime'], ['createdAt' => 'created_at', 'size' => 'size', 'id' => 'id'], '-createdAt', false);

        return ApiResponse::paginated($list->paginate($query), fn (Media $m) => $m->toItem());
    }

    public function show(Request $request, int $id): JsonResponse
    {
        abort_unless($request->user()->can('media.view'), 403, 'Forbidden.');

        return ApiResponse::data(Media::query()->with('uploader')->findOrFail($id)->toItem());
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('media.create'), 403, 'Forbidden.');
        $data = $request->validate([
            'file' => ['required', 'file', 'max:'.(self::MAX_BYTES / 1024)],
            'alt' => ['sometimes', 'array:ar,en'],
            'alt.ar' => ['nullable', 'string', 'max:255'],
            'alt.en' => ['nullable', 'string', 'max:255'],
        ]);

        $disk = (string) config('filesystems.media_disk', 'public');
        $stored = $this->uploads->store($request->file('file'), 'file', $disk, 'media', SecureUploadService::MEDIA_TYPES, self::MAX_BYTES);

        $media = Media::query()->create([
            'disk' => $disk,
            'path' => $stored['path'],
            'filename' => basename($stored['path']),
            'original_name' => $stored['original'],
            'mime' => $stored['mime'],
            'kind' => $this->kind($stored['mime']),
            'size' => $stored['size'],
            'width' => $stored['width'],
            'height' => $stored['height'],
            'alt_ar' => strip_tags((string) ($data['alt']['ar'] ?? '')) ?: null,
            'alt_en' => strip_tags((string) ($data['alt']['en'] ?? '')) ?: null,
            'checksum' => $stored['checksum'],
            'uploaded_by' => $request->user()->id,
        ]);

        return ApiResponse::created($media->load('uploader')->toItem());
    }

    public function update(Request $request, int $id): JsonResponse
    {
        abort_unless($request->user()->can('media.update'), 403, 'Forbidden.');
        $data = $request->validate([
            'alt' => ['required', 'array:ar,en'],
            'alt.ar' => ['nullable', 'string', 'max:255'],
            'alt.en' => ['nullable', 'string', 'max:255'],
        ]);
        $media = Media::query()->findOrFail($id);
        $media->fill(['alt_ar' => strip_tags((string) ($data['alt']['ar'] ?? '')), 'alt_en' => strip_tags((string) ($data['alt']['en'] ?? ''))])->save();

        return ApiResponse::data($media->load('uploader')->toItem());
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        abort_unless($request->user()->can('media.delete'), 403, 'Forbidden.');
        $media = Media::query()->findOrFail($id);

        if ($media->disk !== 'url') {
            Storage::disk($media->disk)->delete($media->path);
        }
        $media->delete(); // FKs referencing media are ON DELETE SET NULL

        return ApiResponse::noContent();
    }

    private function kind(string $mime): string
    {
        return match (true) {
            str_starts_with($mime, 'image/') => 'image',
            str_starts_with($mime, 'video/') => 'video',
            $mime === 'application/pdf' => 'pdf',
            default => 'document',
        };
    }
}

<?php

namespace App\Modules\Media\Infrastructure\Models;

use App\Modules\Audit\Infrastructure\Concerns\Auditable;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Support\Concerns\HasLocalizedAttributes;
use App\Support\Content\InvalidatesContentCache;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Public media library (images, PDFs, video). Applicant uploads (CVs, complaint attachments) are NOT
 * media: they live on the private disk and are referenced from their request row only.
 * disk = "url" → `path` is an absolute/site-relative URL of a pre-existing static asset (demo seeds).
 */
class Media extends Model
{
    use Auditable, HasFactory, HasLocalizedAttributes, InvalidatesContentCache;

    protected $table = 'media';

    protected $fillable = [
        'disk', 'path', 'filename', 'original_name', 'mime', 'kind', 'size', 'width', 'height',
        'alt_ar', 'alt_en', 'checksum', 'uploaded_by',
    ];

    protected function casts(): array
    {
        return ['size' => 'integer', 'width' => 'integer', 'height' => 'integer'];
    }

    protected static function newFactory(): \Database\Factories\MediaFactory
    {
        return \Database\Factories\MediaFactory::new();
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function url(): string
    {
        if ($this->disk === 'url') {
            return $this->path;
        }

        $url = Storage::disk($this->disk)->url($this->path);

        return Str::startsWith($url, ['http://', 'https://']) ? $url : url($url);
    }

    /** Contract `MediaRef`. */
    public function toRef(): array
    {
        return [
            'id' => $this->id,
            'url' => $this->url(),
            'alt' => $this->localized('alt'),
            'mime' => $this->mime,
            'width' => $this->width,
            'height' => $this->height,
        ];
    }

    /** Contract `MediaItem` (admin). */
    public function toItem(): array
    {
        return [
            'id' => $this->id,
            'url' => $this->url(),
            'filename' => $this->original_name ?: $this->filename,
            'mime' => $this->mime,
            'kind' => $this->kind,
            'size' => (int) $this->size,
            'width' => $this->width,
            'height' => $this->height,
            'alt' => $this->localized('alt'),
            'uploader' => $this->uploader ? ['id' => $this->uploader->id, 'name' => $this->uploader->name] : null,
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }

    public function auditLabel(): string
    {
        return $this->original_name ?: $this->filename;
    }

    public function revalidationTags(): array
    {
        return ['home', 'pages', 'news', 'offers'];
    }
}

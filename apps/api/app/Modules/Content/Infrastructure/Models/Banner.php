<?php

namespace App\Modules\Content\Infrastructure\Models;

use App\Modules\Audit\Infrastructure\Concerns\Auditable;
use App\Modules\Media\Infrastructure\Models\Media;
use App\Support\Concerns\HasLocalizedAttributes;
use App\Support\Concerns\HasPosition;
use App\Support\Concerns\HasStatus;
use App\Support\Concerns\TracksAuthors;
use App\Support\Content\InvalidatesContentCache;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Banner extends Model
{
    use Auditable, HasLocalizedAttributes, HasPosition, HasStatus, InvalidatesContentCache, SoftDeletes, TracksAuthors;

    protected $fillable = [
        'title_ar', 'title_en', 'subtitle_ar', 'subtitle_en', 'media_id', 'cta_label_ar', 'cta_label_en', 'cta_href',
        'placement', 'starts_at', 'ends_at', 'position', 'status',
    ];

    protected function casts(): array
    {
        return ['starts_at' => 'date', 'ends_at' => 'date', 'position' => 'integer'];
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class);
    }
}

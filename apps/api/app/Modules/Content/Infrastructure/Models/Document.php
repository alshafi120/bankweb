<?php

namespace App\Modules\Content\Infrastructure\Models;

use App\Modules\Audit\Infrastructure\Concerns\Auditable;
use App\Modules\Media\Infrastructure\Models\Media;
use App\Support\Concerns\HasLocalizedAttributes;
use App\Support\Concerns\HasPosition;
use App\Support\Concerns\HasStatus;
use App\Support\Concerns\TracksAuthors;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/** Reports / governance PDFs library (pages reference them through `documents` blocks). */
class Document extends Model
{
    use Auditable, HasLocalizedAttributes, HasPosition, HasStatus, SoftDeletes, TracksAuthors;

    protected $fillable = ['title_ar', 'title_en', 'media_id', 'category', 'year', 'position', 'status'];

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class);
    }
}

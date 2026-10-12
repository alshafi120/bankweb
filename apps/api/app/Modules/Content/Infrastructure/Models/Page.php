<?php

namespace App\Modules\Content\Infrastructure\Models;

use App\Modules\Audit\Infrastructure\Concerns\Auditable;
use App\Support\Concerns\HasLocalizedAttributes;
use App\Support\Concerns\HasSeo;
use App\Support\Concerns\HasStatus;
use App\Support\Concerns\Sluggable;
use App\Support\Concerns\TracksAuthors;
use App\Support\Content\InvalidatesContentCache;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Page extends Model
{
    use Auditable, HasFactory, HasLocalizedAttributes, HasSeo, HasStatus, InvalidatesContentCache, Sluggable, SoftDeletes, TracksAuthors;

    protected $fillable = ['slug', 'title_ar', 'title_en', 'summary_ar', 'summary_en', 'template', 'status', 'publish_at', 'published_at'];

    protected function casts(): array
    {
        return ['publish_at' => 'datetime', 'published_at' => 'datetime'];
    }

    protected static function newFactory(): \Database\Factories\PageFactory
    {
        return \Database\Factories\PageFactory::new();
    }

    public function sections(): HasMany
    {
        return $this->hasMany(PageSection::class)->orderBy('position')->orderBy('id');
    }

    public function revalidationTags(): array
    {
        return $this->slug === 'home' ? ['home'] : ['pages', 'page:'.$this->slug, 'sitemap'];
    }

    public function revalidationPaths(): array
    {
        return [$this->slug === 'home' ? '/' : '/'.$this->slug];
    }
}

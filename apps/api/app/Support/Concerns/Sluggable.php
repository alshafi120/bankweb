<?php

namespace App\Support\Concerns;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * Generates a unique, URL-safe slug from the English title/name when none is given.
 * Models may override slugSource().
 */
trait Sluggable
{
    public static function bootSluggable(): void
    {
        static::saving(function ($model): void {
            $slug = (string) $model->getAttribute('slug');
            if ($slug === '') {
                $model->setAttribute('slug', $model->uniqueSlug(Str::slug((string) $model->slugSource()) ?: Str::lower(Str::random(8))));
            } else {
                $model->setAttribute('slug', Str::slug($slug) ?: Str::lower(Str::random(8)));
            }
        });
    }

    protected function slugSource(): ?string
    {
        foreach (['title_en', 'name_en', 'title_ar', 'name_ar'] as $column) {
            if (filled($this->getAttribute($column))) {
                return (string) $this->getAttribute($column);
            }
        }

        return null;
    }

    protected function uniqueSlug(string $base): string
    {
        $base = Str::limit($base, 80, '');
        $slug = $base;
        $i = 2;
        while ($this->slugExists($slug)) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }

    private function slugExists(string $slug): bool
    {
        $query = static::query()->where('slug', $slug);
        if (in_array(SoftDeletes::class, class_uses_recursive(static::class), true)) {
            $query->withTrashed();
        }
        if ($this->exists) {
            $query->whereKeyNot($this->getKey());
        }

        return $query->exists();
    }
}

<?php

namespace App\Support\Content;

use Illuminate\Database\Eloquent\Model;

/** Model events → ContentCache::changed() with the model's ISR tags/paths. */
trait InvalidatesContentCache
{
    public static function bootInvalidatesContentCache(): void
    {
        $handler = function (Model $model): void {
            ContentCache::changed($model->revalidationTags(), $model->revalidationPaths());
        };

        static::saved($handler);
        static::deleted($handler);
        if (method_exists(static::class, 'restored')) {
            static::restored($handler);
        }
    }

    /** @return list<string> Next.js fetch tags (apps/web/src/lib/api/client.ts) */
    public function revalidationTags(): array
    {
        return ['home'];
    }

    /** @return list<string> locale-less paths */
    public function revalidationPaths(): array
    {
        return [];
    }
}

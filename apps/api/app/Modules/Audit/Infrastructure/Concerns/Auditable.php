<?php

namespace App\Modules\Audit\Infrastructure\Concerns;

use App\Modules\Audit\Application\Services\AuditLogger;
use App\Modules\Audit\Domain\Enums\AuditAction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

/**
 * Model observer trait: create/update/delete → audit log with before/after diff.
 * Only writes when an admin is authenticated (seeders, public form submissions and scheduled jobs
 * are not "admin operations"; they are logged by their own flows where relevant).
 */
trait Auditable
{
    /** Set to false to silence the generic observer (e.g. when a specialised action logs itself). */
    public static bool $auditingEnabled = true;

    public static function bootAuditable(): void
    {
        $handler = function (string $event, AuditAction $action) {
            return function (Model $model) use ($event, $action): void {
                if (! static::$auditingEnabled || ! Auth::guard('web')->check()) {
                    return;
                }
                $logger = app(AuditLogger::class);
                $changes = $logger->diff($model, $event);
                if ($event === 'updated' && $changes === null) {
                    return;
                }
                $logger->log($action, $model, $changes);
            };
        };

        static::created($handler('created', AuditAction::Create));
        static::updated($handler('updated', AuditAction::Update));
        static::deleted($handler('deleted', AuditAction::Delete));
    }

    public function auditResourceType(): string
    {
        return Str::kebab(Str::pluralStudly(class_basename($this)));
    }

    public function auditLabel(): ?string
    {
        foreach (['title_ar', 'name_ar', 'title_en', 'name_en', 'reference', 'name', 'slug', 'key', 'location'] as $column) {
            $value = $this->getAttribute($column);
            if (is_string($value) && $value !== '') {
                return $value;
            }
        }

        return null;
    }

    public static function withoutAuditing(callable $callback): mixed
    {
        $previous = static::$auditingEnabled;
        static::$auditingEnabled = false;
        try {
            return $callback();
        } finally {
            static::$auditingEnabled = $previous;
        }
    }
}

<?php

namespace App\Modules\Audit\Application\Services;

use App\Modules\Audit\Domain\Enums\AuditAction;
use App\Modules\Audit\Infrastructure\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Throwable;

/**
 * Writes the immutable audit trail: who, what, which resource, before/after (sensitive keys masked),
 * IP, User-Agent, when. Never throws into the business flow.
 */
class AuditLogger
{
    /** Keys whose values are never written to the audit log. */
    private const SENSITIVE = [
        'password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes', 'national_id',
        'national_id_hash', 'phone', 'phone_hash', 'token', 'secret', 'ip_hash', 'api_key', 'current_password',
    ];

    /** Noise not worth diffing. */
    private const IGNORED = ['updated_at', 'created_at', 'last_login_at', 'last_login_ip', 'failed_login_attempts'];

    public function __construct(private readonly Request $request) {}

    public function log(
        AuditAction|string $action,
        Model|string|null $resource = null,
        ?array $changes = null,
        ?int $userId = null,
        ?string $resourceId = null,
        ?string $resourceLabel = null,
    ): ?AuditLog {
        try {
            [$type, $id, $label] = $this->describe($resource, $resourceId, $resourceLabel);

            return AuditLog::query()->create([
                'user_id' => $userId ?? Auth::guard('web')->id(),
                'action' => $action instanceof AuditAction ? $action->value : $action,
                'resource_type' => $type,
                'resource_id' => $id,
                'resource_label' => $label !== null ? Str::limit($label, 250) : null,
                'changes' => $changes !== null ? $this->mask($changes) : null,
                'ip_address' => $this->request->ip(),
                'user_agent' => Str::limit((string) $this->request->userAgent(), 250, ''),
            ]);
        } catch (Throwable $e) {
            report($e);

            return null;
        }
    }

    /** @return array{before?: array, after?: array}|null */
    public function diff(Model $model, string $event): ?array
    {
        $after = $model->getAttributes();
        $before = $model->getOriginal();

        return match ($event) {
            'created' => ['after' => $this->clean($after)],
            'deleted' => ['before' => $this->clean($before)],
            default => $this->changed($model),
        };
    }

    /** @return array{before: array, after: array}|null */
    private function changed(Model $model): ?array
    {
        $changes = array_diff_key($model->getChanges(), array_flip(self::IGNORED));
        if ($changes === []) {
            return null;
        }
        $before = [];
        foreach (array_keys($changes) as $key) {
            $before[$key] = $model->getRawOriginal($key);
        }

        return ['before' => $this->clean($before), 'after' => $this->clean($changes)];
    }

    private function clean(array $values): array
    {
        $values = array_diff_key($values, array_flip(self::IGNORED));
        foreach ($values as $k => $v) {
            if (is_string($v) && strlen($v) > 2000) {
                $values[$k] = Str::limit($v, 2000);
            }
            if (is_string($v) && str_starts_with($v, '[') || is_string($v) && str_starts_with($v, '{')) {
                $decoded = json_decode($v, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $values[$k] = $decoded;
                }
            }
        }

        return $values;
    }

    /** Recursively replace sensitive values with "••••". */
    public function mask(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_string($key) && $this->isSensitive($key)) {
                $data[$key] = $value === null ? null : '••••';
            } elseif (is_array($value)) {
                $data[$key] = $this->mask($value);
            }
        }

        return $data;
    }

    private function isSensitive(string $key): bool
    {
        $k = Str::snake($key);
        foreach (self::SENSITIVE as $s) {
            if ($k === $s || str_starts_with($k, 'two_factor_') || str_ends_with($k, '_token') || str_contains($k, 'password')) {
                return true;
            }
        }

        return false;
    }

    /** @return array{0: ?string, 1: ?string, 2: ?string} */
    private function describe(Model|string|null $resource, ?string $id, ?string $label): array
    {
        if ($resource instanceof Model) {
            $type = method_exists($resource, 'auditResourceType') ? $resource->auditResourceType() : Str::kebab(Str::pluralStudly(class_basename($resource)));
            $label ??= method_exists($resource, 'auditLabel') ? $resource->auditLabel() : null;

            return [$type, $id ?? (string) $resource->getKey(), $label];
        }

        return [$resource, $id, $label];
    }
}

<?php

namespace App\Support\Admin;

use Closure;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Contract `ListQuery`: page, perPage (≤ 100, default 15), search, status, sort ("createdAt" | "-createdAt"),
 * filter[...]. Only whitelisted sort keys and filters are applied (no user input reaches raw SQL).
 */
final class ListQuery
{
    public function __construct(
        public readonly int $page,
        public readonly int $perPage,
        public readonly ?string $search,
        public readonly ?string $status,
        public readonly ?string $sort,
        /** @var array<string, string> */
        public readonly array $filters,
    ) {}

    public static function fromRequest(Request $request): self
    {
        $v = validator($request->query(), [
            'page' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'perPage' => ['nullable', 'integer', 'min:1', 'max:100'],
            'search' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'string', 'max:40'],
            'sort' => ['nullable', 'string', 'max:60', 'regex:/^-?[A-Za-z]+$/'],
            'filter' => ['nullable', 'array'],
            'filter.*' => ['nullable', 'string', 'max:120'],
        ]);
        if ($v->fails()) {
            throw new ValidationException($v);
        }
        $data = $v->validated();

        return new self(
            (int) ($data['page'] ?? 1),
            (int) ($data['perPage'] ?? 15),
            filled($data['search'] ?? null) ? trim($data['search']) : null,
            filled($data['status'] ?? null) ? $data['status'] : null,
            $data['sort'] ?? null,
            array_filter((array) ($data['filter'] ?? []), fn ($v) => $v !== null && $v !== ''),
        );
    }

    /**
     * @param  list<string>  $searchable
     * @param  array<string, string|Closure(Builder, string): void>  $filters
     * @param  array<string, string>  $sorts
     */
    public function apply(Builder $query, array $searchable, array $filters, array $sorts, string $defaultSort, bool $hasStatus = true): Builder
    {
        if ($this->search !== null && $searchable !== []) {
            $like = '%'.addcslashes($this->search, '%_\\').'%';
            $query->where(function (Builder $q) use ($searchable, $like) {
                foreach ($searchable as $column) {
                    $q->orWhere($column, 'like', $like);
                }
            });
        }

        if ($this->status !== null && $hasStatus) {
            $query->whereIn($query->getModel()->qualifyColumn('status'), explode(',', $this->status));
        }

        foreach ($this->filters as $key => $value) {
            if (! isset($filters[$key])) {
                continue;
            }
            $filter = $filters[$key];
            $filter instanceof Closure ? $filter($query, $value) : $query->where($filter, $value);
        }

        $sort = $this->sort ?? $defaultSort;
        $desc = str_starts_with($sort, '-');
        $column = $sorts[ltrim($sort, '-')] ?? null;
        if ($column === null) {
            $desc = str_starts_with($defaultSort, '-');
            $column = $sorts[ltrim($defaultSort, '-')] ?? 'id';
        }
        $query->orderBy($column, $desc ? 'desc' : 'asc')->orderBy($query->getModel()->getQualifiedKeyName(), $desc ? 'desc' : 'asc');

        return $query;
    }

    public function paginate(Builder $query): LengthAwarePaginator
    {
        return $query->paginate($this->perPage, ['*'], 'page', $this->page);
    }
}

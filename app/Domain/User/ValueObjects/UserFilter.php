<?php

declare(strict_types=1);

namespace App\Domain\User\ValueObjects;

/**
 * Value Object for User filtering criteria.
 * Provides type-safe filtering parameters for user queries.
 */
final readonly class UserFilter
{
    private function __construct(
        public ?string $search,
        public ?string $status,
        public bool $includeDeleted,
        public bool $onlyDeleted,
        public string $orderBy,
        public string $orderDirection,
    ) {
    }

    /**
     * Create a new UserFilter with default values.
     */
    public static function create(
        ?string $search = null,
        ?string $status = null,
        bool $includeDeleted = false,
        bool $onlyDeleted = false,
        string $orderBy = 'created_at',
        string $orderDirection = 'desc',
    ): self {
        return new self(
            search: $search,
            status: $status,
            includeDeleted: $includeDeleted,
            onlyDeleted: $onlyDeleted,
            orderBy: $orderBy,
            orderDirection: $orderDirection,
        );
    }

    /**
     * Create filter from array (for backward compatibility with existing code).
     *
     * @param array<string, mixed> $filters
     */
    public static function fromArray(array $filters): self
    {
        return new self(
            search: $filters['search'] ?? null,
            status: $filters['status'] ?? null,
            includeDeleted: $filters['include_deleted'] ?? false,
            onlyDeleted: $filters['only_deleted'] ?? false,
            orderBy: $filters['order_by'] ?? 'created_at',
            orderDirection: $filters['order_direction'] ?? 'desc',
        );
    }

    /**
     * Convert filter to array (for repository implementation).
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'search' => $this->search,
            'status' => $this->status,
            'include_deleted' => $this->includeDeleted,
            'only_deleted' => $this->onlyDeleted,
            'order_by' => $this->orderBy,
            'order_direction' => $this->orderDirection,
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Domain\Admin\ValueObjects;

/**
 * Value Object for Admin filtering criteria.
 * Provides type-safe filtering parameters for admin queries.
 */
final readonly class AdminFilter
{
    /**
     * @param array<string> $excludeRoles
     */
    private function __construct(
        public ?string $search,
        public ?string $status,
        public array $excludeRoles,
        public string $orderBy,
        public string $orderDirection,
    ) {
    }

    /**
     * Create a new AdminFilter with default values.
     *
     * @param array<string> $excludeRoles
     */
    public static function create(
        ?string $search = null,
        ?string $status = null,
        array $excludeRoles = [],
        string $orderBy = 'id',
        string $orderDirection = 'asc',
    ): self {
        return new self(
            search: $search,
            status: $status,
            excludeRoles: $excludeRoles,
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
            excludeRoles: $filters['exclude_roles'] ?? [],
            orderBy: $filters['order_by'] ?? 'id',
            orderDirection: $filters['order_direction'] ?? 'asc',
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
            'exclude_roles' => $this->excludeRoles,
            'order_by' => $this->orderBy,
            'order_direction' => $this->orderDirection,
        ];
    }
}

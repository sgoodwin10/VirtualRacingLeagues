<?php

declare(strict_types=1);

namespace App\Domain\Competition\Entities;

use App\Domain\Competition\ValueObjects\TiebreakerRuleSlug;
use DateTimeImmutable;

/**
 * Round Tiebreaker Rule Domain Entity.
 *
 * Represents a tiebreaker rule that can be applied to resolve ties in round totals.
 * This is a reference entity - rules are system-defined and rarely change.
 */
final class RoundTiebreakerRule
{
    private function __construct(
        private ?int $id,
        private string $name,
        private TiebreakerRuleSlug $slug,
        private ?string $description,
        private bool $isActive,
        private int $defaultOrder,
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt,
    ) {
    }

    /**
     * Create a new tiebreaker rule (for seeding/admin).
     */
    public static function create(
        string $name,
        TiebreakerRuleSlug $slug,
        ?string $description,
        int $defaultOrder,
    ): self {
        return new self(
            id: null,
            name: $name,
            slug: $slug,
            description: $description,
            isActive: true,
            defaultOrder: $defaultOrder,
            createdAt: new DateTimeImmutable(),
            updatedAt: new DateTimeImmutable(),
        );
    }

    /**
     * Reconstitute from persistence.
     */
    public static function reconstitute(
        int $id,
        string $name,
        TiebreakerRuleSlug $slug,
        ?string $description,
        bool $isActive,
        int $defaultOrder,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt,
    ): self {
        return new self(
            id: $id,
            name: $name,
            slug: $slug,
            description: $description,
            isActive: $isActive,
            defaultOrder: $defaultOrder,
            createdAt: $createdAt,
            updatedAt: $updatedAt,
        );
    }

    // Getters

    public function id(): ?int
    {
        return $this->id;
    }

    public function name(): string
    {
        return $this->name;
    }

    public function slug(): TiebreakerRuleSlug
    {
        return $this->slug;
    }

    public function description(): ?string
    {
        return $this->description;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function defaultOrder(): int
    {
        return $this->defaultOrder;
    }

    public function createdAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function updatedAt(): DateTimeImmutable
    {
        return $this->updatedAt;
    }

    // Business logic methods

    /**
     * Activate the rule.
     */
    public function activate(): void
    {
        if (! $this->isActive) {
            $this->isActive = true;
            $this->updatedAt = new DateTimeImmutable();
        }
    }

    /**
     * Deactivate the rule.
     */
    public function deactivate(): void
    {
        if ($this->isActive) {
            $this->isActive = false;
            $this->updatedAt = new DateTimeImmutable();
        }
    }

    /**
     * Update default order.
     */
    public function updateDefaultOrder(int $order): void
    {
        if ($this->defaultOrder !== $order) {
            $this->defaultOrder = $order;
            $this->updatedAt = new DateTimeImmutable();
        }
    }

    /**
     * Exception for persistence to set ID after creation.
     */
    public function setId(int $id): void
    {
        $this->id = $id;
    }
}

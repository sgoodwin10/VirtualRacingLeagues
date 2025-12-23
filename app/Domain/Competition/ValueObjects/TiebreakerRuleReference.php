<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

/**
 * Tiebreaker Rule Reference Value Object.
 *
 * Represents a reference to a tiebreaker rule with its order in a season.
 * Immutable.
 */
final readonly class TiebreakerRuleReference
{
    public function __construct(
        private int $id,
        private TiebreakerRuleSlug $slug,
        private int $order,
    ) {
    }

    public function id(): int
    {
        return $this->id;
    }

    public function slug(): TiebreakerRuleSlug
    {
        return $this->slug;
    }

    public function order(): int
    {
        return $this->order;
    }

    /**
     * Convert to array for storage.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug->value(),
            'order' => $this->order,
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

/**
 * Tiebreaker Resolution Value Object.
 *
 * Represents a single instance where a tiebreaker rule was applied.
 * Immutable record of how a specific tie was resolved.
 */
final readonly class TiebreakerResolution
{
    /**
     * @param  array<int>  $driverIds  IDs of drivers involved in the tie
     * @param  string  $ruleSlug  Slug of the rule that resolved the tie
     * @param  int|null  $winnerId  ID of the driver who won the tiebreaker (null if unresolved)
     * @param  string  $explanation  Human-readable explanation
     */
    public function __construct(
        private array $driverIds,
        private string $ruleSlug,
        private ?int $winnerId,
        private string $explanation,
    ) {
    }

    /**
     * @return array<int>
     */
    public function driverIds(): array
    {
        return $this->driverIds;
    }

    public function ruleSlug(): string
    {
        return $this->ruleSlug;
    }

    public function winnerId(): ?int
    {
        return $this->winnerId;
    }

    public function explanation(): string
    {
        return $this->explanation;
    }

    public function wasResolved(): bool
    {
        return $this->winnerId !== null;
    }

    /**
     * Convert to array for JSON storage.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'driver_ids' => $this->driverIds,
            'rule_slug' => $this->ruleSlug,
            'winner_id' => $this->winnerId,
            'explanation' => $this->explanation,
            'resolved' => $this->wasResolved(),
        ];
    }

    /**
     * Create from array (for reconstitution from JSON).
     *
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            driverIds: $data['driver_ids'] ?? [],
            ruleSlug: $data['rule_slug'] ?? '',
            winnerId: $data['winner_id'] ?? null,
            explanation: $data['explanation'] ?? '',
        );
    }
}

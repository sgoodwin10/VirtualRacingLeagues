<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

/**
 * Tiebreaker Information Value Object.
 *
 * Stores the complete information about how tiebreaker rules were applied to a round.
 * Immutable collection of all tie resolutions.
 */
final readonly class TiebreakerInformation
{
    /**
     * @param array<TiebreakerResolution> $resolutions
     * @param array<string> $appliedRules Slugs of rules that were actually used
     * @param bool $hadUnresolvedTies Whether any ties couldn't be broken
     */
    public function __construct(
        private array $resolutions,
        private array $appliedRules,
        private bool $hadUnresolvedTies,
    ) {
    }

    /**
     * Create empty tiebreaker information (no ties existed).
     */
    public static function empty(): self
    {
        return new self(
            resolutions: [],
            appliedRules: [],
            hadUnresolvedTies: false,
        );
    }

    /**
     * @return array<TiebreakerResolution>
     */
    public function resolutions(): array
    {
        return $this->resolutions;
    }

    /**
     * @return array<string>
     */
    public function appliedRules(): array
    {
        return $this->appliedRules;
    }

    public function hadUnresolvedTies(): bool
    {
        return $this->hadUnresolvedTies;
    }

    public function hasResolutions(): bool
    {
        return !empty($this->resolutions);
    }

    /**
     * Convert to array for JSON storage.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'resolutions' => array_map(fn($r) => $r->toArray(), $this->resolutions),
            'applied_rules' => $this->appliedRules,
            'had_unresolved_ties' => $this->hadUnresolvedTies,
        ];
    }

    /**
     * Create from array (for reconstitution from JSON).
     *
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $resolutions = [];
        foreach ($data['resolutions'] ?? [] as $resolutionData) {
            $resolutions[] = TiebreakerResolution::fromArray($resolutionData);
        }

        return new self(
            resolutions: $resolutions,
            appliedRules: $data['applied_rules'] ?? [],
            hadUnresolvedTies: $data['had_unresolved_ties'] ?? false,
        );
    }
}

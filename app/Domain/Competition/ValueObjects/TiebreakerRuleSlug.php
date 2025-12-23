<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

use App\Domain\Competition\Exceptions\InvalidTiebreakerRuleSlugException;

/**
 * Tiebreaker Rule Slug Value Object.
 *
 * Represents the unique identifier for a tiebreaker rule.
 * Valid slugs: highest-qualifying-position, race-1-best-result, best-result-all-races
 */
final readonly class TiebreakerRuleSlug
{
    private const HIGHEST_QUALIFYING_POSITION = 'highest-qualifying-position';
    private const RACE_1_BEST_RESULT = 'race-1-best-result';
    private const BEST_RESULT_ALL_RACES = 'best-result-all-races';

    private const VALID_SLUGS = [
        self::HIGHEST_QUALIFYING_POSITION,
        self::RACE_1_BEST_RESULT,
        self::BEST_RESULT_ALL_RACES,
    ];

    private function __construct(private string $slug)
    {
        $this->validate();
    }

    public static function from(string $slug): self
    {
        return new self($slug);
    }

    /**
     * Create highest qualifying position slug.
     */
    public static function highestQualifyingPosition(): self
    {
        return new self(self::HIGHEST_QUALIFYING_POSITION);
    }

    /**
     * Create race 1 best result slug.
     */
    public static function race1BestResult(): self
    {
        return new self(self::RACE_1_BEST_RESULT);
    }

    /**
     * Create best result all races slug.
     */
    public static function bestResultAllRaces(): self
    {
        return new self(self::BEST_RESULT_ALL_RACES);
    }

    public function value(): string
    {
        return $this->slug;
    }

    public function equals(self $other): bool
    {
        return $this->slug === $other->slug;
    }

    public function isHighestQualifyingPosition(): bool
    {
        return $this->slug === self::HIGHEST_QUALIFYING_POSITION;
    }

    public function isRace1BestResult(): bool
    {
        return $this->slug === self::RACE_1_BEST_RESULT;
    }

    public function isBestResultAllRaces(): bool
    {
        return $this->slug === self::BEST_RESULT_ALL_RACES;
    }

    /**
     * @throws InvalidTiebreakerRuleSlugException
     */
    private function validate(): void
    {
        if (!in_array($this->slug, self::VALID_SLUGS, true)) {
            throw InvalidTiebreakerRuleSlugException::invalidSlug($this->slug, self::VALID_SLUGS);
        }
    }
}

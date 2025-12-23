<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

/**
 * SeasonTiebreakerRulesEnabled Domain Event.
 *
 * Fired when tiebreaker rules are enabled for a season.
 */
final readonly class SeasonTiebreakerRulesEnabled
{
    /**
     * @param array<string> $ruleSlugs
     */
    public function __construct(
        public int $seasonId,
        public int $competitionId,
        public array $ruleSlugs,
        public string $occurredAt,
    ) {
    }
}

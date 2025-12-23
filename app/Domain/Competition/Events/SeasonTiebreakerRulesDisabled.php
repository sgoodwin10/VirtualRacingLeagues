<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

/**
 * SeasonTiebreakerRulesDisabled Domain Event.
 *
 * Fired when tiebreaker rules are disabled for a season.
 */
final readonly class SeasonTiebreakerRulesDisabled
{
    public function __construct(
        public int $seasonId,
        public int $competitionId,
        public string $occurredAt,
    ) {
    }
}

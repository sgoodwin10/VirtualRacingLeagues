<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

/**
 * SeasonTiebreakerRulesUpdated Domain Event.
 *
 * Fired when the tiebreaker rules configuration for a season is updated.
 */
final readonly class SeasonTiebreakerRulesUpdated
{
    /**
     * @param array<array<string, mixed>> $changes
     */
    public function __construct(
        public int $seasonId,
        public int $competitionId,
        public array $changes,
        public string $occurredAt,
    ) {
    }
}

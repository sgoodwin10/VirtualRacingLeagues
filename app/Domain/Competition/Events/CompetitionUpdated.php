<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

/**
 * Domain event fired when a competition is updated.
 */
final readonly class CompetitionUpdated
{
    /**
     * @param  array<string, array{old: mixed, new: mixed}>  $changes
     */
    public function __construct(
        public int $competitionId,
        public int $leagueId,
        public array $changes,
        public string $occurredAt,
    ) {
    }
}

<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

/**
 * Domain event fired when a competition is deleted.
 */
final readonly class CompetitionDeleted
{
    public function __construct(
        public int $competitionId,
        public int $leagueId,
        public string $occurredAt,
    ) {
    }
}

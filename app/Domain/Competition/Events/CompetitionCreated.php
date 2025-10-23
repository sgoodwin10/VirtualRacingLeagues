<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

/**
 * Domain event fired when a competition is created.
 */
final readonly class CompetitionCreated
{
    public function __construct(
        public int $competitionId,
        public int $leagueId,
        public string $name,
        public int $platformId,
        public int $createdByUserId,
        public string $occurredAt,
    ) {
    }
}

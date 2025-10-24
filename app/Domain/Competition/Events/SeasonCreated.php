<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

/**
 * SeasonCreated Domain Event.
 *
 * Fired when a new season is created.
 */
final readonly class SeasonCreated
{
    public function __construct(
        public int $seasonId,
        public int $competitionId,
        public int $leagueId,
        public string $name,
        public string $slug,
        public int $createdByUserId,
        public string $occurredAt,
    ) {
    }
}

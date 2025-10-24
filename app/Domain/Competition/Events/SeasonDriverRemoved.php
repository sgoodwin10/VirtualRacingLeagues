<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

/**
 * SeasonDriverRemoved Domain Event.
 *
 * Fired when a driver is removed from a season.
 */
final readonly class SeasonDriverRemoved
{
    public function __construct(
        public int $seasonDriverId,
        public int $seasonId,
        public int $leagueDriverId,
        public string $occurredAt,
    ) {
    }
}

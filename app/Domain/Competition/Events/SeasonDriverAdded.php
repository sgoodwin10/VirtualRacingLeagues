<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

/**
 * SeasonDriverAdded Domain Event.
 *
 * Fired when a driver is added to a season.
 */
final readonly class SeasonDriverAdded
{
    public function __construct(
        public int $seasonDriverId,
        public int $seasonId,
        public int $leagueDriverId,
        public int $driverId,
        public string $status,
        public string $occurredAt,
    ) {
    }
}

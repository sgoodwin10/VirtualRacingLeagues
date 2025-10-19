<?php

declare(strict_types=1);

namespace App\Domain\Driver\Events;

final readonly class DriverAddedToLeague
{
    public function __construct(
        public int $leagueId,
        public int $driverId,
        public string $displayName,
        public ?int $driverNumber,
        public string $status
    ) {
    }
}

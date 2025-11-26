<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

final readonly class RaceResultCreated
{
    public function __construct(
        public int $raceResultId,
        public int $raceId,
        public int $driverId,
        public ?int $position,
        public string $occurredAt,
    ) {
    }
}

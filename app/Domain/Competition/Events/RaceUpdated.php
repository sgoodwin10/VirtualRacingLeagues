<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

use DateTimeImmutable;

final readonly class RaceUpdated
{
    public function __construct(
        public int $raceId,
        public int $roundId,
        public DateTimeImmutable $occurredAt,
    ) {
    }
}

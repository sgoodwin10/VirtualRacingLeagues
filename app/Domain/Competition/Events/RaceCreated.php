<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

use DateTimeImmutable;

final readonly class RaceCreated
{
    public function __construct(
        public int $raceId,
        public int $roundId,
        public int $raceNumber,
        public ?string $name,
        public ?string $type,
        public DateTimeImmutable $occurredAt,
    ) {
    }
}

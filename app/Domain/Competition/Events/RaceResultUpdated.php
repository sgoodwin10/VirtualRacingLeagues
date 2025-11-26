<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

final readonly class RaceResultUpdated
{
    /**
     * @param array<string, array{old: mixed, new: mixed}> $changes
     */
    public function __construct(
        public int $raceResultId,
        public int $raceId,
        public array $changes,
        public string $occurredAt,
    ) {
    }
}

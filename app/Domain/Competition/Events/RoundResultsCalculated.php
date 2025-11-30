<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

/**
 * Domain event fired when round results are calculated and stored.
 */
final readonly class RoundResultsCalculated
{
    public function __construct(
        public int $roundId,
        public int $seasonId,
        public string $occurredAt,
    ) {
    }
}

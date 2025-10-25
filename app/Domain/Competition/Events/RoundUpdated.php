<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

/**
 * Domain event fired when a round is updated.
 */
final readonly class RoundUpdated
{
    public function __construct(
        public int $roundId,
        public int $seasonId,
        public string $occurredAt,
    ) {
    }
}

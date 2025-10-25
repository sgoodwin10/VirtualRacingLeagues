<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

/**
 * Domain event fired when a round is deleted.
 */
final readonly class RoundDeleted
{
    public function __construct(
        public int $roundId,
        public int $seasonId,
        public string $occurredAt,
    ) {
    }
}

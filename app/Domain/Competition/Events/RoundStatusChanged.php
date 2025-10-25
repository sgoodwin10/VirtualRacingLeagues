<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

/**
 * Domain event fired when a round status changes.
 */
final readonly class RoundStatusChanged
{
    public function __construct(
        public int $roundId,
        public int $seasonId,
        public string $oldStatus,
        public string $newStatus,
        public string $occurredAt,
    ) {
    }
}

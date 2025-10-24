<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

/**
 * SeasonDriverStatusChanged Domain Event.
 *
 * Fired when a season driver's status changes.
 */
final readonly class SeasonDriverStatusChanged
{
    public function __construct(
        public int $seasonDriverId,
        public int $seasonId,
        public string $oldStatus,
        public string $newStatus,
        public string $occurredAt,
    ) {
    }
}

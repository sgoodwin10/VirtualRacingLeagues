<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

/**
 * SeasonStatusChanged Domain Event.
 *
 * Fired when a season's status changes.
 */
final readonly class SeasonStatusChanged
{
    public function __construct(
        public int $seasonId,
        public int $competitionId,
        public string $oldStatus,
        public string $newStatus,
        public string $occurredAt,
    ) {
    }
}

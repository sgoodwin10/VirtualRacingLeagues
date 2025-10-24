<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

/**
 * SeasonDeleted Domain Event.
 *
 * Fired when a season is soft-deleted.
 */
final readonly class SeasonDeleted
{
    public function __construct(
        public int $seasonId,
        public int $competitionId,
        public string $occurredAt,
    ) {
    }
}

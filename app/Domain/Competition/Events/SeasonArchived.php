<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

/**
 * SeasonArchived Domain Event.
 *
 * Fired when a season is archived.
 */
final readonly class SeasonArchived
{
    public function __construct(
        public int $seasonId,
        public int $competitionId,
        public string $occurredAt,
    ) {
    }
}

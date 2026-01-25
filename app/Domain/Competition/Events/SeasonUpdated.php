<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

/**
 * SeasonUpdated Domain Event.
 *
 * Fired when a season is updated.
 */
final readonly class SeasonUpdated
{
    /**
     * @param  array<string, array{old: mixed, new: mixed}>  $changes
     */
    public function __construct(
        public int $seasonId,
        public int $competitionId,
        public array $changes,
        public string $occurredAt,
    ) {
    }
}

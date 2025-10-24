<?php

declare(strict_types=1);

namespace App\Domain\Team\Events;

/**
 * Domain event triggered when a team is deleted.
 */
final readonly class TeamDeleted
{
    public function __construct(
        public int $teamId,
        public int $seasonId,
    ) {
    }
}

<?php

declare(strict_types=1);

namespace App\Domain\League\Events;

use App\Domain\League\Entities\League;

/**
 * Domain Event: League Updated.
 * Dispatched when a league is updated.
 */
final readonly class LeagueUpdated
{
    public function __construct(
        public League $league,
    ) {
    }
}

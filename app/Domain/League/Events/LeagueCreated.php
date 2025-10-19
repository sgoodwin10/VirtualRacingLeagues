<?php

declare(strict_types=1);

namespace App\Domain\League\Events;

use App\Domain\League\Entities\League;

/**
 * Domain Event: League Created.
 * Dispatched when a new league is created.
 */
final readonly class LeagueCreated
{
    public function __construct(
        public League $league,
    ) {
    }
}

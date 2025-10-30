<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Data;

/**
 * DTO for season statistics.
 */
class SeasonStatsData extends Data
{
    public function __construct(
        public int $total_drivers,
        public int $active_drivers,
        public int $total_races,
        public int $completed_races,
        public int $total_divisions,
        public int $total_teams,
        public int $total_rounds,
        public int $completed_rounds,
    ) {
    }
}

<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Data;

/**
 * DTO representing competition statistics.
 * Used as a nested DTO within CompetitionData.
 */
class CompetitionStatsData extends Data
{
    public function __construct(
        public int $total_seasons = 0,
        public int $active_seasons = 0,
        public int $total_drivers = 0,
        public int $total_rounds = 0,
        public int $total_races = 0,
        public ?string $next_race_date = null,
    ) {
    }
}

<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Data;

/**
 * DTO for season statistics within a competition response.
 */
class CompetitionSeasonStatsData extends Data
{
    public function __construct(
        public int $driver_count = 0,
        public int $round_count = 0,
        public int $race_count = 0,
    ) {
    }
}

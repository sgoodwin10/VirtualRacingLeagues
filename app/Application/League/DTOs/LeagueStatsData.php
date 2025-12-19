<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use Spatie\LaravelData\Data;

/**
 * League Statistics DTO.
 * Contains counts for competitions, seasons, and drivers.
 */
final class LeagueStatsData extends Data
{
    public function __construct(
        public readonly int $competitions_count,
        public readonly int $active_seasons_count,
        public readonly int $drivers_count,
    ) {
    }
}

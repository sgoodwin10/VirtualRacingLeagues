<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use Spatie\LaravelData\Data;

/**
 * Public League Detail DTO.
 * Used for displaying detailed league information on the public league detail page.
 * Includes league info, competitions with seasons, statistics, and sidebar data.
 */
final class PublicLeagueDetailData extends Data
{
    /**
     * @param PublicLeagueBasicData $league League basic information
     * @param LeagueStatsData $stats League statistics (counts)
     * @param array<int, PublicCompetitionDetailData> $competitions Competitions with seasons
     * @param array<int, mixed> $recent_activity Recent activity (to be typed later)
     * @param array<int, mixed> $upcoming_races Upcoming races (to be typed later)
     * @param array<int, mixed> $championship_leaders Championship leaders (to be typed later)
     */
    public function __construct(
        public readonly PublicLeagueBasicData $league,
        public readonly LeagueStatsData $stats,
        /** @var array<int, PublicCompetitionDetailData> */
        public readonly array $competitions,
        public readonly array $recent_activity,
        public readonly array $upcoming_races,
        public readonly array $championship_leaders,
    ) {
    }
}

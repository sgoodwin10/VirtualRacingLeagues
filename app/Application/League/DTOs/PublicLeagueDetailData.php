<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use Spatie\LaravelData\Data;

/**
 * Public League Detail DTO.
 * Used for displaying detailed league information on the public league detail page.
 * Includes league info, competitions with seasons, statistics, and sidebar data.
 *
 * TODO: Refactor to use proper nested DTOs instead of raw arrays for better type safety.
 *       Create DTOs for: league details, stats, recent_activity, upcoming_races, championship_leaders.
 */
final class PublicLeagueDetailData extends Data
{
    /**
     * @param array{
     *     id: int,
     *     name: string,
     *     slug: string,
     *     tagline: ?string,
     *     description: ?string,
     *     logo_url: ?string,
     *     header_image_url: ?string,
     *     banner_url: ?string,
     *     platforms: array<int, array{id: int, name: string, slug: string}>,
     *     visibility: string,
     *     discord_url: ?string,
     *     website_url: ?string,
     *     twitter_handle: ?string,
     *     youtube_url: ?string,
     *     twitch_url: ?string,
     *     created_at: string
     * } $league
     * @param array{
     *     competitions_count: int,
     *     active_seasons_count: int,
     *     drivers_count: int
     * } $stats
     * @param array<int, PublicCompetitionDetailData> $competitions
     * @param array<int, mixed> $recent_activity
     * @param array<int, mixed> $upcoming_races
     * @param array<int, mixed> $championship_leaders
     */
    public function __construct(
        public readonly array $league,
        public readonly array $stats,
        public readonly array $competitions,
        public readonly array $recent_activity,
        public readonly array $upcoming_races,
        public readonly array $championship_leaders,
    ) {
    }
}

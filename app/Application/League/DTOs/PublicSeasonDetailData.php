<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use Spatie\LaravelData\Data;

/**
 * Public Season Detail DTO.
 * Used for displaying detailed season information on the public season detail page.
 * Includes season info, league context, rounds with races, standings, and race results.
 *
 * Note: Uses typed arrays with PHPDoc annotations for flexibility and performance.
 * The array structures are fully documented in the constructor's PHPDoc annotations.
 */
final class PublicSeasonDetailData extends Data
{
    /**
     * @param array{
     *     name: string,
     *     slug: string,
     *     logo_url: ?string,
     *     header_image_url: ?string
     * } $league
     * @param array{name: string, slug: string} $competition
     * @param array{
     *     id: int,
     *     name: string,
     *     slug: string,
     *     car_class: ?string,
     *     description: ?string,
     *     logo_url: ?string,
     *     banner_url: ?string,
     *     status: string,
     *     is_active: bool,
     *     is_completed: bool,
     *     race_divisions_enabled: bool,
     *     stats: array{
     *         total_drivers: int,
     *         active_drivers: int,
     *         total_rounds: int,
     *         completed_rounds: int,
     *         total_races: int,
     *         completed_races: int
     *     }
     * } $season
     * @param array<int, array{
     *     id: int,
     *     round_number: int,
     *     name: ?string,
     *     slug: string,
     *     scheduled_at: ?string,
     *     circuit_name: ?string,
     *     circuit_country: ?string,
     *     track_name: ?string,
     *     track_layout: ?string,
     *     status: string,
     *     status_label: string,
     *     races: array<int, array{
     *         id: int,
     *         race_number: int,
     *         name: ?string,
     *         race_type: string,
     *         status: string,
     *         is_qualifier: bool
     *     }>,
     *     qualifying_results: array<int, mixed>,
     *     race_time_results: array<int, mixed>,
     *     fastest_lap_results: array<int, mixed>,
     *     round_standings: array<int, mixed>
     * }> $rounds
     * @param array<int, mixed> $standings
     * @param bool $has_divisions
     * @param array<int, mixed> $qualifying_results Results from qualifying sessions (is_qualifier = true)
     * @param array<int, mixed> $fastest_lap_results Results sorted by fastest lap times
     * @param array<int, mixed> $race_time_results Results sorted by race times
     * @param bool $drop_round_enabled Whether drop rounds are enabled for driver standings
     * @param bool $team_championship_enabled Whether team championship is enabled
     * @param array<int, mixed> $team_championship_results Team championship standings
     * @param bool $teams_drop_rounds_enabled Whether drop rounds are enabled for team standings
     */
    public function __construct(
        public readonly array $league,
        public readonly array $competition,
        public readonly array $season,
        public readonly array $rounds,
        public readonly array $standings,
        public readonly bool $has_divisions,
        public readonly array $qualifying_results,
        public readonly array $fastest_lap_results,
        public readonly array $race_time_results,
        public readonly bool $drop_round_enabled = false,
        public readonly bool $team_championship_enabled = false,
        public readonly array $team_championship_results = [],
        public readonly bool $teams_drop_rounds_enabled = false,
    ) {
    }
}

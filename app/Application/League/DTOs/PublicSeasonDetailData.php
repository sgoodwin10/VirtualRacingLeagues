<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use Spatie\LaravelData\Data;

/**
 * Public Season Detail DTO.
 * Used for displaying detailed season information on the public season detail page.
 * Includes season info, league context, rounds with races, and standings.
 *
 * TODO: Refactor to use proper nested DTOs instead of raw arrays for better type safety.
 *       Create DTOs for: league details, season details, round details, race details.
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
     *     track_name: ?string,
     *     track_layout: ?string,
     *     status: string,
     *     status_label: string,
     *     races: array<int, array{
     *         id: int,
     *         race_number: int,
     *         name: ?string,
     *         race_type: string,
     *         status: string
     *     }>
     * }> $rounds
     * @param array<int, mixed> $standings
     * @param bool $has_divisions
     */
    public function __construct(
        public readonly array $league,
        public readonly array $competition,
        public readonly array $season,
        public readonly array $rounds,
        public readonly array $standings,
        public readonly bool $has_divisions,
    ) {
    }
}

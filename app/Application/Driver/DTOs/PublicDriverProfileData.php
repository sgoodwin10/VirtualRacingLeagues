<?php

declare(strict_types=1);

namespace App\Application\Driver\DTOs;

use Spatie\LaravelData\Data;

/**
 * Public Driver Profile DTO.
 * Used for displaying driver information on the public dashboard.
 * Does NOT include first_name or last_name for privacy reasons.
 */
final class PublicDriverProfileData extends Data
{
    /**
     * @param  string  $nickname  Driver's nickname
     * @param  int|null  $driver_number  Driver's league number
     * @param array{
     *     psn_id?: string,
     *     discord_id?: string,
     *     iracing_id?: string
     * } $platform_accounts Platform accounts (only includes non-null values)
     * @param array{
     *     total_poles: int,
     *     total_podiums: int
     * } $career_stats Career statistics across all seasons/leagues
     * @param array<int, array{
     *     league_name: string,
     *     league_slug: string,
     *     season_name: string,
     *     season_slug: string,
     *     status: string
     * }> $competitions All seasons the driver has participated in
     */
    public function __construct(
        public readonly string $nickname,
        public readonly ?int $driver_number,
        public readonly array $platform_accounts,
        public readonly array $career_stats,
        public readonly array $competitions,
    ) {
    }
}

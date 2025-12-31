<?php

declare(strict_types=1);

namespace App\Application\Driver\DTOs;

use Spatie\LaravelData\Data;

/**
 * LeagueDriverSeasonData DTO.
 *
 * Represents season participation data for a league driver.
 */
final class LeagueDriverSeasonData extends Data
{
    public function __construct(
        public readonly int $season_id,
        public readonly string $season_name,
        public readonly string $season_slug,
        public readonly string $season_status,
        public readonly int $competition_id,
        public readonly string $competition_name,
        public readonly string $competition_slug,
        public readonly ?string $division_name,
        public readonly ?string $team_name,
        public readonly string $added_at
    ) {
    }
}

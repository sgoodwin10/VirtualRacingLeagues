<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Data;

/**
 * Competition reference data for season context.
 * Lightweight DTO containing competition information with league details for breadcrumbs.
 */
final class SeasonCompetitionData extends Data
{
    public function __construct(
        public int $id,
        public string $name,
        public string $slug,
        public int $platform_id,
        public SeasonLeagueData $league,
    ) {
    }
}

<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Data;

/**
 * Competition reference data for season context.
 * Lightweight DTO containing competition information with league and platform details.
 */
final class SeasonCompetitionData extends Data
{
    public function __construct(
        public int $id,
        public string $name,
        public string $slug,
        public int $platform_id,
        public ?string $competition_colour,
        public SeasonLeagueData $league,
        public PlatformData $platform,
    ) {
    }
}

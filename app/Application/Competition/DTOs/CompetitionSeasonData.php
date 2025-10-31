<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Data;

/**
 * DTO representing a season within a competition response.
 * This is a simplified version of SeasonData used in competition contexts.
 */
class CompetitionSeasonData extends Data
{
    public function __construct(
        public int $id,
        public string $name,
        public string $slug,
        public string $status,
        public bool $is_active,
        public bool $is_archived,
        public string $created_at,
        public CompetitionSeasonStatsData $stats,
    ) {
    }
}

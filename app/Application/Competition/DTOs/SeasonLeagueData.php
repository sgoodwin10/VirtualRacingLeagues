<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Data;

/**
 * League reference data for season context.
 * Lightweight DTO containing league information for breadcrumbs.
 */
final class SeasonLeagueData extends Data
{
    public function __construct(
        public int $id,
        public string $name,
        public string $slug,
    ) {
    }
}

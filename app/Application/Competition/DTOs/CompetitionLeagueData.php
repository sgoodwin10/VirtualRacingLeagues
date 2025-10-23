<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Data;

/**
 * League reference data for competition context.
 * Lightweight DTO containing only essential league information.
 */
final class CompetitionLeagueData extends Data
{
    public function __construct(
        public int $id,
        public string $name,
        public string $slug,
    ) {
    }
}

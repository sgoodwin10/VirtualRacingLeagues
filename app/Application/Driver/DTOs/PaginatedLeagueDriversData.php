<?php

declare(strict_types=1);

namespace App\Application\Driver\DTOs;

use Spatie\LaravelData\Data;

final class PaginatedLeagueDriversData extends Data
{
    /**
     * @param array<LeagueDriverData> $data
     * @param int $total
     * @param int $per_page
     * @param int $current_page
     * @param int $last_page
     */
    public function __construct(
        public readonly array $data,
        public readonly int $total,
        public readonly int $per_page,
        public readonly int $current_page,
        public readonly int $last_page
    ) {
    }
}

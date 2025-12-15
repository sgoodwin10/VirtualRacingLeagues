<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use Spatie\LaravelData\Data;

final class PublicRaceResultsData extends Data
{
    /**
     * @param array{
     *     id: int,
     *     race_number: int|null,
     *     name: string|null,
     *     race_type: string,
     *     status: string,
     *     is_qualifier: bool,
     *     race_points: bool
     * } $race
     * @param array<int, array<string, mixed>> $results
     * @param bool $has_divisions
     */
    public function __construct(
        public array $race,
        public array $results,
        public bool $has_divisions,
    ) {
    }
}

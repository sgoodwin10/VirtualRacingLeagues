<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;

/**
 * DTO for round results response.
 */
final class RoundResultsData extends Data
{
    /**
     * @param array{
     *     id: int,
     *     round_number: int,
     *     name: string|null,
     *     status: string,
     *     round_results: array<mixed>|null,
     *     qualifying_results: array<mixed>|null,
     *     race_time_results: array<mixed>|null,
     *     fastest_lap_results: array<mixed>|null
     * } $round
     * @param DataCollection<int, DivisionData> $divisions
     * @param DataCollection<int, RaceEventResultData> $race_events
     * @param bool $has_orphaned_results Whether the round has results with NULL division_id
     */
    public function __construct(
        public readonly array $round,
        #[DataCollectionOf(DivisionData::class)]
        public readonly DataCollection $divisions,
        #[DataCollectionOf(RaceEventResultData::class)]
        public readonly DataCollection $race_events,
        public readonly bool $has_orphaned_results = false,
    ) {
    }
}

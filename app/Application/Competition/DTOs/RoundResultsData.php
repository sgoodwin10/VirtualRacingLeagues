<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Data;

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
     * @param array<int, DivisionData> $divisions
     * @param array<int, RaceEventResultData> $race_events
     */
    public function __construct(
        public readonly array $round,
        public readonly array $divisions,
        public readonly array $race_events,
    ) {
        // Runtime validation: ensure all divisions are DivisionData instances
        foreach ($divisions as $division) {
            if (!$division instanceof DivisionData) {
                throw new \InvalidArgumentException('All divisions must be instances of DivisionData');
            }
        }

        // Runtime validation: ensure all race_events are RaceEventResultData instances
        foreach ($race_events as $event) {
            if (!$event instanceof RaceEventResultData) {
                throw new \InvalidArgumentException('All race_events must be instances of RaceEventResultData');
            }
        }
    }
}

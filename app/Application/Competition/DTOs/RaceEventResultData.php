<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Data;

/**
 * DTO for a race event with its results.
 */
final class RaceEventResultData extends Data
{
    /**
     * @param array<int, RaceResultData> $results Array of RaceResultData instances
     */
    public function __construct(
        public readonly int $id,
        public readonly int $race_number,
        public readonly ?string $name,
        public readonly bool $is_qualifier,
        public readonly string $status,
        public readonly bool $race_points,
        public readonly array $results,
    ) {
    }
}

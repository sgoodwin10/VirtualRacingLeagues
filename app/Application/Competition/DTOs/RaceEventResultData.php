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
     * @param array<int, RaceResultData> $results
     */
    public function __construct(
        public readonly int $id,
        public readonly int $race_number,
        public readonly ?string $name,
        public readonly bool $is_qualifier,
        public readonly string $status,
        public readonly array $results,
    ) {
        // Runtime validation: ensure all elements are RaceResultData instances
        foreach ($results as $result) {
            if (!$result instanceof RaceResultData) {
                throw new \InvalidArgumentException('All results must be instances of RaceResultData');
            }
        }
    }
}

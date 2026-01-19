<?php

declare(strict_types=1);

namespace App\Application\Export\DTOs;

use Spatie\LaravelData\Data;

/**
 * DTO for a single season standing row in CSV export.
 * Dynamically includes columns for each round.
 */
final class SeasonStandingExportRow extends Data
{
    /**
     * @param array<string, mixed> $round_columns Dynamic round columns (e.g., 'R1 Points', 'R1 FL', 'R1 Pole')
     */
    public function __construct(
        public readonly int $position,
        public readonly ?string $division,
        public readonly string $driver_name,
        public readonly ?string $team,
        public readonly array $round_columns,
        public readonly float $total_points,
        public readonly ?float $drop_round_total,
    ) {
    }

    /**
     * Convert to CSV row array.
     * Order: Position, Division, Driver Name, Team, Round columns..., Total Points, Drop Round Total
     *
     * @return array<string|int|float|null>
     */
    public function toRow(): array
    {
        $row = [
            $this->position,
            $this->division ?? '',
            $this->driver_name,
            $this->team ?? '',
        ];

        // Add round columns in order
        foreach ($this->round_columns as $value) {
            $row[] = $value ?? '';
        }

        // Add totals
        $row[] = $this->total_points;
        if ($this->drop_round_total !== null) {
            $row[] = $this->drop_round_total;
        }

        return $row;
    }

    /**
     * Get CSV headers for season standings.
     *
     * @param array<string> $round_headers Dynamic round headers (e.g., ['R1 Points', 'R1 FL', 'R1 Pole', ...])
     * @return array<string>
     */
    public static function headers(array $round_headers, bool $includeDropTotal): array
    {
        $headers = [
            'Position',
            'Division',
            'Driver Name',
            'Team',
        ];

        // Add round headers
        $headers = array_merge($headers, $round_headers);

        // Add totals
        $headers[] = 'Total Points';
        if ($includeDropTotal) {
            $headers[] = 'Drop Round Total';
        }

        return $headers;
    }
}

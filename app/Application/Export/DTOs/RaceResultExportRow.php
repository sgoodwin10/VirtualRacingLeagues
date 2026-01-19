<?php

declare(strict_types=1);

namespace App\Application\Export\DTOs;

use Spatie\LaravelData\Data;

/**
 * DTO for a single race result row in CSV export.
 */
final class RaceResultExportRow extends Data
{
    public function __construct(
        public readonly ?int $position,
        public readonly ?string $division,
        public readonly string $driver_name,
        public readonly ?string $team,
        public readonly ?string $race_time,
        public readonly ?string $time_difference,
        public readonly ?string $penalties,
        public readonly ?string $fastest_lap,
        public readonly ?float $points,
    ) {
    }

    /**
     * Convert to CSV row array.
     *
     * @return array<string|int|float|null>
     */
    public function toRow(): array
    {
        return [
            $this->position,
            $this->division ?? '',
            $this->driver_name,
            $this->team ?? '',
            $this->race_time ?? '',
            $this->time_difference ?? '',
            $this->penalties ?? '',
            $this->fastest_lap ?? '',
            $this->points ?? '',
        ];
    }

    /**
     * Get CSV headers for race results.
     *
     * @return array<string>
     */
    public static function headers(): array
    {
        return [
            'Position',
            'Division',
            'Driver Name',
            'Team',
            'Race Time',
            'Time Difference',
            'Penalties',
            'Fastest Lap',
            'Points',
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Application\Export\DTOs;

use Spatie\LaravelData\Data;

/**
 * DTO for a single cross-division result row in CSV export.
 * Used for fastest laps, race times, and qualifying times.
 */
final class CrossDivisionExportRow extends Data
{
    public function __construct(
        public readonly int $position,
        public readonly ?string $division,
        public readonly string $driver_name,
        public readonly ?string $team,
        public readonly string $time,
        public readonly ?string $time_difference,
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
            $this->time,
            $this->time_difference ?? '',
        ];
    }

    /**
     * Get CSV headers for cross-division results.
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
            'Time',
            'Time Difference',
        ];
    }
}

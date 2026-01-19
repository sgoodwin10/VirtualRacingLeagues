<?php

declare(strict_types=1);

namespace App\Application\Export\DTOs;

use Spatie\LaravelData\Data;

/**
 * DTO for a single round standing row in CSV export.
 */
final class RoundStandingExportRow extends Data
{
    public function __construct(
        public readonly ?int $position,
        public readonly ?string $division,
        public readonly string $driver_name,
        public readonly ?string $team,
        public readonly float $round_points,
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
            $this->round_points,
        ];
    }

    /**
     * Get CSV headers for round standings.
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
            'Round Points',
        ];
    }
}

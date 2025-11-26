<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Data;

final class CreateRaceResultData extends Data
{
    public function __construct(
        public int $driver_id,
        public ?int $division_id = null,
        public ?int $position = null,
        public ?string $race_time = null,
        public ?string $race_time_difference = null,
        public ?string $fastest_lap = null,
        public ?string $penalties = null,
        public bool $has_fastest_lap = false,
        public bool $has_pole = false,
        public bool $dnf = false,
    ) {
    }
}

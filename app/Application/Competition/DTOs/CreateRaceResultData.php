<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Data;

/**
 * Input DTO for creating a race result.
 */
final class CreateRaceResultData extends Data
{
    public function __construct(
        public int $driver_id,
        public ?int $division_id = null,
        public ?int $position = null,
        public ?string $original_race_time = null,
        public ?string $original_race_time_difference = null,
        public ?string $final_race_time_difference = null,
        public ?string $fastest_lap = null,
        public ?string $penalties = null,
        public bool $has_fastest_lap = false,
        public bool $has_pole = false,
        public bool $dnf = false,
    ) {
    }

    /**
     * Validation rules for request input.
     *
     * @return array<string, array<int, mixed>>
     */
    public static function rules(): array
    {
        return [
            'driver_id' => ['required', 'integer'],
            'division_id' => ['nullable', 'integer'],
            'position' => ['nullable', 'integer', 'min:1'],
            'original_race_time' => ['nullable', 'string', 'regex:/^\d{1,2}:\d{2}\.\d{3}$/'],
            'original_race_time_difference' => ['nullable', 'string'],
            'final_race_time_difference' => ['nullable', 'string'],
            'fastest_lap' => ['nullable', 'string', 'regex:/^\d{1,2}:\d{2}\.\d{3}$/'],
            'penalties' => ['nullable', 'string'],
            'has_fastest_lap' => ['boolean'],
            'has_pole' => ['boolean'],
            'dnf' => ['boolean'],
        ];
    }
}

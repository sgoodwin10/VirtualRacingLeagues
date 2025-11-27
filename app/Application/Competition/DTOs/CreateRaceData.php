<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\Between;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;

final class CreateRaceData extends Data
{
    public function __construct(
        // Basic - race_number is nullable for auto-increment
        #[Nullable, IntegerType, Min(1)]
        public ?int $race_number,
        #[Nullable, StringType, Between(3, 100)]
        public ?string $name,
        #[Nullable, StringType, In(['sprint', 'feature', 'endurance', 'qualifying', 'custom'])]
        public ?string $race_type,
        // Qualifying - defaults to 'none' if not provided
        #[Nullable, StringType, In(['standard', 'time_trial', 'none', 'previous_race'])]
        public ?string $qualifying_format,
        #[Nullable, IntegerType, Min(1)]
        public ?int $qualifying_length,
        #[Nullable, StringType, Max(50)]
        public ?string $qualifying_tire,
        // Grid - defaults to 'manual' if not provided
        #[Nullable, StringType]
        #[In(['qualifying', 'previous_race', 'reverse_previous', 'championship', 'reverse_championship', 'manual'])]
        public ?string $grid_source,
        #[Nullable, IntegerType, Min(1)]
        public ?int $grid_source_race_id,
        // Length - defaults to 20 laps
        #[Nullable, StringType, In(['laps', 'time'])]
        public ?string $length_type,
        #[Nullable, IntegerType, Min(1)]
        public ?int $length_value,
        #[Nullable, BooleanType]
        public ?bool $extra_lap_after_time,
        // Platform settings
        #[Nullable, StringType, Max(100)]
        public ?string $weather,
        #[Nullable, StringType, Max(100)]
        public ?string $tire_restrictions,
        #[Nullable, StringType, Max(100)]
        public ?string $fuel_usage,
        #[Nullable, StringType, Max(100)]
        public ?string $damage_model,
        // Penalties & Rules - defaults to false
        #[Nullable, BooleanType]
        public ?bool $track_limits_enforced,
        #[Nullable, BooleanType]
        public ?bool $false_start_detection,
        #[Nullable, BooleanType]
        public ?bool $collision_penalties,
        #[Nullable, BooleanType]
        public ?bool $mandatory_pit_stop,
        #[Nullable, IntegerType, Min(0)]
        public ?int $minimum_pit_time,
        #[Nullable, StringType]
        public ?string $assists_restrictions,
        // Bonus Points
        #[Nullable, IntegerType, Min(1)]
        public ?int $fastest_lap,
        #[Nullable, BooleanType]
        public ?bool $fastest_lap_top_10,
        #[Nullable, IntegerType, Min(1)]
        public ?int $qualifying_pole,
        #[Nullable, BooleanType]
        public ?bool $qualifying_pole_top_10,
        // Points - defaults to F1 standard points system
        #[Nullable, ArrayType]
        public ?array $points_system,
        #[Nullable, IntegerType, Min(0)]
        public ?int $dnf_points,
        #[Nullable, IntegerType, Min(0)]
        public ?int $dns_points,
        #[Nullable, BooleanType]
        public ?bool $race_points,
        // Notes
        #[Nullable, StringType]
        public ?string $race_notes,
    ) {
    }

    /**
     * Prepare data for pipeline with validation.
     *
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public static function prepareForPipeline(array $payload): array
    {
        // Validate: if fastest_lap is null, fastest_lap_top_10 must be false or null
        $fastestLap = $payload['fastest_lap'] ?? null;
        $fastestLapTop10 = $payload['fastest_lap_top_10'] ?? null;

        if ($fastestLap === null && $fastestLapTop10 === true) {
            throw new \InvalidArgumentException(
                'fastest_lap_top_10 cannot be true when fastest_lap is null'
            );
        }

        // Validate: if qualifying_pole is null, qualifying_pole_top_10 must be false or null
        $qualifyingPole = $payload['qualifying_pole'] ?? null;
        $qualifyingPoleTop10 = $payload['qualifying_pole_top_10'] ?? null;

        if ($qualifyingPole === null && $qualifyingPoleTop10 === true) {
            throw new \InvalidArgumentException(
                'qualifying_pole_top_10 cannot be true when qualifying_pole is null'
            );
        }

        // Validate: fastest_lap must be at least 1 when provided
        if (isset($payload['fastest_lap']) && $payload['fastest_lap'] !== null && $payload['fastest_lap'] < 1) {
            throw new \InvalidArgumentException(
                'fastest_lap must be at least 1 when provided'
            );
        }

        // Validate: qualifying_pole must be at least 1 when provided
        if (isset($payload['qualifying_pole']) && $payload['qualifying_pole'] !== null && $payload['qualifying_pole'] < 1) {
            throw new \InvalidArgumentException(
                'qualifying_pole must be at least 1 when provided'
            );
        }

        return $payload;
    }
}

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
use Spatie\LaravelData\Attributes\Validation\Numeric;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

final class UpdateRaceData extends Data
{
    public function __construct(
        // Basic
        #[Nullable, StringType, Between(3, 100)]
        public string|Optional|null $name = new Optional(),
        #[Nullable, StringType, In(['sprint', 'feature', 'endurance', 'qualifying', 'custom'])]
        public string|Optional|null $race_type = new Optional(),
        // Qualifying
        #[Nullable, StringType, In(['standard', 'time_trial', 'none', 'previous_race'])]
        public string|Optional|null $qualifying_format = new Optional(),
        #[Nullable, IntegerType, Min(1)]
        public int|Optional|null $qualifying_length = new Optional(),
        #[Nullable, StringType, Max(50)]
        public string|Optional|null $qualifying_tire = new Optional(),
        // Grid
        #[Nullable, StringType]
        #[In(['qualifying', 'previous_race', 'reverse_previous', 'championship', 'reverse_championship', 'manual'])]
        public string|Optional|null $grid_source = new Optional(),
        #[Nullable, IntegerType, Min(1)]
        public int|Optional|null $grid_source_race_id = new Optional(),
        // Length
        #[Nullable, StringType, In(['laps', 'time'])]
        public string|Optional|null $length_type = new Optional(),
        #[Nullable, IntegerType, Min(1)]
        public int|Optional|null $length_value = new Optional(),
        #[Nullable, BooleanType]
        public bool|Optional|null $extra_lap_after_time = new Optional(),
        // Platform settings
        #[Nullable, StringType, Max(100)]
        public string|Optional|null $weather = new Optional(),
        #[Nullable, StringType, Max(100)]
        public string|Optional|null $tire_restrictions = new Optional(),
        #[Nullable, StringType, Max(100)]
        public string|Optional|null $fuel_usage = new Optional(),
        #[Nullable, StringType, Max(100)]
        public string|Optional|null $damage_model = new Optional(),
        // Penalties & Rules
        #[Nullable, BooleanType]
        public bool|Optional|null $track_limits_enforced = new Optional(),
        #[Nullable, BooleanType]
        public bool|Optional|null $false_start_detection = new Optional(),
        #[Nullable, BooleanType]
        public bool|Optional|null $collision_penalties = new Optional(),
        #[Nullable, BooleanType]
        public bool|Optional|null $mandatory_pit_stop = new Optional(),
        #[Nullable, IntegerType, Min(0)]
        public int|Optional|null $minimum_pit_time = new Optional(),
        #[Nullable, StringType]
        public string|Optional|null $assists_restrictions = new Optional(),
        // Bonus Points
        #[Nullable, Numeric, Min(0)]
        public int|float|Optional|null $fastest_lap = new Optional(),
        #[Nullable, BooleanType]
        public bool|Optional|null $fastest_lap_top_10 = new Optional(),
        #[Nullable, Numeric, Min(0)]
        public int|float|Optional|null $qualifying_pole = new Optional(),
        #[Nullable, BooleanType]
        public bool|Optional|null $qualifying_pole_top_10 = new Optional(),
        // Points
        #[Nullable, ArrayType]
        public array|Optional|null $points_system = new Optional(),
        #[Nullable, Numeric, Min(0)]
        public int|float|Optional|null $dnf_points = new Optional(),
        #[Nullable, Numeric, Min(0)]
        public int|float|Optional|null $dns_points = new Optional(),
        #[Nullable, BooleanType]
        public bool|Optional|null $race_points = new Optional(),
        // Notes
        #[Nullable, StringType]
        public string|Optional|null $race_notes = new Optional(),
        // Status
        #[Nullable, StringType, In(['scheduled', 'completed'])]
        public string|Optional|null $status = new Optional(),
    ) {
    }

    /**
     * Normalize empty strings to null for nullable fields and validate cross-field rules.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public static function prepareForPipeline(array $payload): array
    {
        $nullableStringFields = [
            'name',
            'race_type',
            'qualifying_format',
            'qualifying_tire',
            'grid_source',
            'length_type',
            'weather',
            'tire_restrictions',
            'fuel_usage',
            'damage_model',
            'assists_restrictions',
            'race_notes',
            'status',
        ];

        foreach ($nullableStringFields as $field) {
            if (isset($payload[$field]) && $payload[$field] === '') {
                $payload[$field] = null;
            }
        }

        // Validate: if fastest_lap is explicitly set to null, fastest_lap_top_10 cannot be true
        if (
            array_key_exists('fastest_lap', $payload)
            && $payload['fastest_lap'] === null
            && array_key_exists('fastest_lap_top_10', $payload)
            && $payload['fastest_lap_top_10'] === true
        ) {
            throw new \InvalidArgumentException(
                'fastest_lap_top_10 cannot be true when fastest_lap is null'
            );
        }

        // Validate: if qualifying_pole is explicitly set to null, qualifying_pole_top_10 cannot be true
        if (
            array_key_exists('qualifying_pole', $payload)
            && $payload['qualifying_pole'] === null
            && array_key_exists('qualifying_pole_top_10', $payload)
            && $payload['qualifying_pole_top_10'] === true
        ) {
            throw new \InvalidArgumentException(
                'qualifying_pole_top_10 cannot be true when qualifying_pole is null'
            );
        }

        // Validate: fastest_lap must be at least 0 when provided
        if (
            array_key_exists('fastest_lap', $payload)
            && $payload['fastest_lap'] !== null
            && $payload['fastest_lap'] < 0
        ) {
            throw new \InvalidArgumentException(
                'fastest_lap must be at least 0 when provided'
            );
        }

        // Validate: qualifying_pole must be at least 0 when provided
        if (
            array_key_exists('qualifying_pole', $payload)
            && $payload['qualifying_pole'] !== null
            && $payload['qualifying_pole'] < 0
        ) {
            throw new \InvalidArgumentException(
                'qualifying_pole must be at least 0 when provided'
            );
        }

        return $payload;
    }
}

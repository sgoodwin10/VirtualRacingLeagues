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
use Spatie\LaravelData\Support\Validation\ValidationContext;

final class CreateRaceData extends Data
{
    public function __construct(
        // Basic - race_number is nullable for auto-increment, 0 for qualifying races
        #[Nullable, IntegerType, Min(0)]
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
        #[Nullable, Numeric, Min(0)]
        public int|float|null $fastest_lap,
        #[Nullable, BooleanType]
        public ?bool $fastest_lap_top_10,
        #[Nullable, Numeric, Min(0)]
        public int|float|null $qualifying_pole,
        #[Nullable, BooleanType]
        public ?bool $qualifying_pole_top_10,
        // Points - defaults to F1 standard points system
        #[Nullable, ArrayType]
        public ?array $points_system,
        #[Nullable, Numeric, Min(0)]
        public int|float|null $dnf_points,
        #[Nullable, Numeric, Min(0)]
        public int|float|null $dns_points,
        #[Nullable, BooleanType]
        public ?bool $race_points,
        // Notes
        #[Nullable, StringType]
        public ?string $race_notes,
    ) {
    }

    /**
     * Additional validation rules for cross-field validation.
     *
     * @return array<string, array<mixed>>
     */
    public static function rules(ValidationContext $context): array
    {
        return [
            // grid_source_race_id is required when grid_source is 'previous_race'
            'grid_source_race_id' => [
                function ($attribute, $value, $fail) use ($context) {
                    $gridSource = $context->payload['grid_source'] ?? null;
                    if ($gridSource === 'previous_race' && empty($value)) {
                        $fail('The grid_source_race_id field is required when grid_source is previous_race.');
                    }
                },
            ],
            // minimum_pit_time is required when mandatory_pit_stop is true
            'minimum_pit_time' => [
                function ($attribute, $value, $fail) use ($context) {
                    $mandatoryPitStop = $context->payload['mandatory_pit_stop'] ?? false;
                    if ($mandatoryPitStop === true && $value === null) {
                        $fail('The minimum_pit_time field is required when mandatory_pit_stop is true.');
                    }
                },
            ],
        ];
    }
}

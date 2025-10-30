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
        // Basic
        #[Required, IntegerType, Min(0)]
        public int $race_number,
        #[Nullable, StringType, Between(3, 100)]
        public ?string $name,
        #[Nullable, StringType, In(['sprint', 'feature', 'endurance', 'qualifying', 'custom'])]
        public ?string $race_type,
        // Qualifying
        #[Required, StringType, In(['standard', 'time_trial', 'none', 'previous_race'])]
        public string $qualifying_format,
        #[Nullable, IntegerType, Min(1)]
        public ?int $qualifying_length,
        #[Nullable, StringType, Max(50)]
        public ?string $qualifying_tire,
        // Grid
        #[Required, StringType]
        #[In(['qualifying', 'previous_race', 'reverse_previous', 'championship', 'reverse_championship', 'manual'])]
        public string $grid_source,
        #[Nullable, IntegerType, Min(1)]
        public ?int $grid_source_race_id,
        // Length
        #[Required, StringType, In(['laps', 'time'])]
        public string $length_type,
        #[Required, IntegerType, Min(1)]
        public int $length_value,
        #[Required, BooleanType]
        public bool $extra_lap_after_time,
        // Platform settings
        #[Nullable, StringType, Max(100)]
        public ?string $weather,
        #[Nullable, StringType, Max(100)]
        public ?string $tire_restrictions,
        #[Nullable, StringType, Max(100)]
        public ?string $fuel_usage,
        #[Nullable, StringType, Max(100)]
        public ?string $damage_model,
        // Penalties & Rules
        #[Required, BooleanType]
        public bool $track_limits_enforced,
        #[Required, BooleanType]
        public bool $false_start_detection,
        #[Required, BooleanType]
        public bool $collision_penalties,
        #[Required, BooleanType]
        public bool $mandatory_pit_stop,
        #[Nullable, IntegerType, Min(0)]
        public ?int $minimum_pit_time,
        #[Nullable, StringType]
        public ?string $assists_restrictions,
        // Division
        #[Required, BooleanType]
        public bool $race_divisions,
        // Points
        #[Required, ArrayType]
        public array $points_system,
        #[Nullable, ArrayType]
        public ?array $bonus_points,
        #[Required, IntegerType, Min(0)]
        public int $dnf_points,
        #[Required, IntegerType, Min(0)]
        public int $dns_points,
        // Notes
        #[Nullable, StringType]
        public ?string $race_notes,
    ) {
    }
}

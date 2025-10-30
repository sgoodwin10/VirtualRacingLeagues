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
        // Division
        #[Nullable, BooleanType]
        public bool|Optional|null $race_divisions = new Optional(),
        // Points
        #[Nullable, ArrayType]
        public array|Optional|null $points_system = new Optional(),
        #[Nullable, ArrayType]
        public array|Optional|null $bonus_points = new Optional(),
        #[Nullable, IntegerType, Min(0)]
        public int|Optional|null $dnf_points = new Optional(),
        #[Nullable, IntegerType, Min(0)]
        public int|Optional|null $dns_points = new Optional(),
        // Notes
        #[Nullable, StringType]
        public string|Optional|null $race_notes = new Optional(),
    ) {
    }
}

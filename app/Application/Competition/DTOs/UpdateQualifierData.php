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

final class UpdateQualifierData extends Data
{
    public function __construct(
        // Basic
        #[Nullable, StringType, Between(3, 100)]
        public string|Optional|null $name = new Optional(),
        // Qualifying Configuration
        #[Nullable, StringType, In(['standard', 'time_trial', 'previous_race'])]
        public string|Optional|null $qualifying_format = new Optional(),
        #[Nullable, IntegerType, Min(1)]
        public int|Optional|null $qualifying_length = new Optional(),
        #[Nullable, StringType, Max(50)]
        public string|Optional|null $qualifying_tire = new Optional(),
        // Platform Settings
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
        #[Nullable, StringType]
        public string|Optional|null $assists_restrictions = new Optional(),
        // Bonus Points
        #[Nullable, ArrayType]
        public array|Optional|null $bonus_points = new Optional(),
        // Notes
        #[Nullable, StringType]
        public string|Optional|null $race_notes = new Optional(),
        // Status
        #[Nullable, StringType, In(['scheduled', 'completed'])]
        public string|Optional|null $status = new Optional(),
    ) {
    }
}

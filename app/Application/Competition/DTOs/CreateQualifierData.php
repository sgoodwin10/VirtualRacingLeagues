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

final class CreateQualifierData extends Data
{
    public function __construct(
        // Basic
        #[Nullable, StringType, Between(3, 100)]
        public ?string $name,
        // Qualifying Configuration
        #[Required, StringType, In(['standard', 'time_trial', 'previous_race'])]
        public string $qualifying_format,
        #[Required, IntegerType, Min(1)]
        public int $qualifying_length,
        #[Nullable, StringType, Max(50)]
        public ?string $qualifying_tire,
        // Platform Settings
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
        #[Nullable, StringType]
        public ?string $assists_restrictions,
        // Division Support
        #[Required, BooleanType]
        public bool $race_divisions,
        // Bonus Points (ONLY pole position allowed)
        #[Nullable, ArrayType]
        public ?array $bonus_points,
        // Notes
        #[Nullable, StringType]
        public ?string $race_notes,
    ) {
    }
}

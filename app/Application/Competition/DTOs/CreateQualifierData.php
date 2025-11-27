<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

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
        // Bonus Points
        #[Nullable, IntegerType, Min(1)]
        public ?int $qualifying_pole,
        #[Nullable, BooleanType]
        public ?bool $qualifying_pole_top_10,
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
        // Validate: if qualifying_pole is null, qualifying_pole_top_10 must be false or null
        $qualifyingPole = $payload['qualifying_pole'] ?? null;
        $qualifyingPoleTop10 = $payload['qualifying_pole_top_10'] ?? null;

        if ($qualifyingPole === null && $qualifyingPoleTop10 === true) {
            throw new \InvalidArgumentException(
                'qualifying_pole_top_10 cannot be true when qualifying_pole is null'
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

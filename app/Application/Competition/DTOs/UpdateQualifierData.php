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
        #[Nullable, IntegerType, Min(1)]
        public int|Optional|null $qualifying_pole = new Optional(),
        #[Nullable, BooleanType]
        public bool|Optional|null $qualifying_pole_top_10 = new Optional(),
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
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public static function prepareForPipeline(array $payload): array
    {
        $nullableStringFields = [
            'name',
            'qualifying_format',
            'qualifying_tire',
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

        // Validate: qualifying_pole must be at least 1 when provided
        if (
            array_key_exists('qualifying_pole', $payload)
            && $payload['qualifying_pole'] !== null
            && $payload['qualifying_pole'] < 1
        ) {
            throw new \InvalidArgumentException(
                'qualifying_pole must be at least 1 when provided'
            );
        }

        return $payload;
    }
}

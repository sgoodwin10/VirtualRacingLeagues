<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Support\Validation\ValidationContext;

/**
 * Data Transfer Object for creating a qualifier.
 */
final class CreateQualifierData extends Data
{
    public function __construct(
        // Basic
        public readonly ?string $name,
        // Qualifying Configuration
        public readonly string $qualifying_format,
        public readonly int $qualifying_length,
        public readonly ?string $qualifying_tire,
        // Platform Settings
        public readonly ?string $weather,
        public readonly ?string $tire_restrictions,
        public readonly ?string $fuel_usage,
        public readonly ?string $damage_model,
        // Penalties & Rules
        public readonly bool $track_limits_enforced,
        public readonly bool $false_start_detection,
        public readonly bool $collision_penalties,
        public readonly ?string $assists_restrictions,
        // Bonus Points
        public readonly int|float|null $qualifying_pole,
        public readonly ?bool $qualifying_pole_top_10,
        // Notes
        public readonly ?string $race_notes,
    ) {
    }

    /**
     * Validation rules including cross-field validation.
     *
     * @return array<string, array<mixed>>
     */
    public static function rules(?ValidationContext $context = null): array
    {
        return [
            'name' => ['nullable', 'string', 'between:3,100'],
            'qualifying_format' => ['required', 'string', 'in:standard,time_trial,previous_race'],
            'qualifying_length' => ['required', 'integer', 'min:1'],
            'qualifying_tire' => ['nullable', 'string', 'max:50'],
            'weather' => ['nullable', 'string', 'max:100'],
            'tire_restrictions' => ['nullable', 'string', 'max:100'],
            'fuel_usage' => ['nullable', 'string', 'max:100'],
            'damage_model' => ['nullable', 'string', 'max:100'],
            'track_limits_enforced' => ['required', 'boolean'],
            'false_start_detection' => ['required', 'boolean'],
            'collision_penalties' => ['required', 'boolean'],
            'assists_restrictions' => ['nullable', 'string'],
            'qualifying_pole' => ['nullable', 'numeric', 'min:0'],
            'qualifying_pole_top_10' => [
                'nullable',
                'boolean',
                function ($attribute, $value, $fail) use ($context) {
                    $qualifyingPole = $context?->payload['qualifying_pole'] ?? null;
                    if ($qualifyingPole === null && $value === true) {
                        $fail('The qualifying_pole_top_10 field cannot be true when qualifying_pole is null.');
                    }
                },
            ],
            'race_notes' => ['nullable', 'string'],
        ];
    }

    /**
     * Normalize empty strings to null for nullable fields.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public static function prepareForPipeline(array $payload): array
    {
        $nullableStringFields = [
            'name',
            'qualifying_tire',
            'weather',
            'tire_restrictions',
            'fuel_usage',
            'damage_model',
            'assists_restrictions',
            'race_notes',
        ];

        foreach ($nullableStringFields as $field) {
            if (isset($payload[$field]) && $payload[$field] === '') {
                $payload[$field] = null;
            }
        }

        return $payload;
    }
}

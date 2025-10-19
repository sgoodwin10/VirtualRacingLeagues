<?php

declare(strict_types=1);

namespace App\Application\Driver\DTOs;

use Spatie\LaravelData\Data;

final class UpdateLeagueDriverData extends Data
{
    public function __construct(
        public readonly ?int $driver_number,
        public readonly string $status,
        public readonly ?string $league_notes
    ) {
    }

    /**
     * Validation rules for updating league-specific driver settings.
     *
     * @return array<string, mixed>
     */
    public static function rules(): array
    {
        return [
            'driver_number' => ['nullable', 'integer', 'min:1', 'max:999'],
            'status' => ['required', 'in:active,inactive,banned'],
            'league_notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * Custom validation messages.
     *
     * @return array<string, string>
     */
    public static function messages(): array
    {
        return [
            'driver_number.min' => 'Driver number must be between 1 and 999',
            'driver_number.max' => 'Driver number must be between 1 and 999',
            'status.required' => 'Status is required',
            'status.in' => 'Status must be one of: active, inactive, banned',
        ];
    }
}

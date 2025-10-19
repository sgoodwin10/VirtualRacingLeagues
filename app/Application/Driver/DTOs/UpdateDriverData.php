<?php

declare(strict_types=1);

namespace App\Application\Driver\DTOs;

use Spatie\LaravelData\Data;

/**
 * DTO for updating global driver fields and league-specific settings.
 * Used when editing a driver in a league context.
 */
final class UpdateDriverData extends Data
{
    public function __construct(
        // Global driver fields (optional - only update if provided)
        public readonly ?string $first_name,
        public readonly ?string $last_name,
        public readonly ?string $nickname,
        public readonly ?string $email,
        public readonly ?string $phone,
        public readonly ?string $psn_id,
        public readonly ?string $gt7_id,
        public readonly ?string $iracing_id,
        public readonly ?int $iracing_customer_id,
        // League-specific fields
        public readonly ?int $driver_number,
        public readonly string $status,
        public readonly ?string $league_notes
    ) {}

    /**
     * Validation rules for updating driver and league settings.
     *
     * @return array<string, mixed>
     */
    public static function rules(): array
    {
        return [
            // Global driver fields
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'nickname' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'psn_id' => ['nullable', 'string', 'max:255'],
            'gt7_id' => ['nullable', 'string', 'max:255'],
            'iracing_id' => ['nullable', 'string', 'max:255'],
            'iracing_customer_id' => ['nullable', 'integer', 'min:1'],
            // League-specific fields
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
            'first_name.max' => 'First name must not exceed 255 characters',
            'last_name.max' => 'Last name must not exceed 255 characters',
            'nickname.max' => 'Nickname must not exceed 255 characters',
            'email.email' => 'Please enter a valid email address',
            'email.max' => 'Email must not exceed 255 characters',
            'phone.max' => 'Phone number must not exceed 20 characters',
            'psn_id.max' => 'PSN ID must not exceed 255 characters',
            'gt7_id.max' => 'GT7 ID must not exceed 255 characters',
            'iracing_id.max' => 'iRacing ID must not exceed 255 characters',
            'iracing_customer_id.min' => 'iRacing Customer ID must be a positive number',
            'driver_number.min' => 'Driver number must be between 1 and 999',
            'driver_number.max' => 'Driver number must be between 1 and 999',
            'status.required' => 'Status is required',
            'status.in' => 'Status must be one of: active, inactive, banned',
            'league_notes.max' => 'League notes must not exceed 1000 characters',
        ];
    }
}

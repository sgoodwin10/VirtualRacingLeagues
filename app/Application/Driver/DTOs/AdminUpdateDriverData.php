<?php

declare(strict_types=1);

namespace App\Application\Driver\DTOs;

use Spatie\LaravelData\Data;

/**
 * DTO for updating global driver fields from admin context.
 * Unlike UpdateDriverData (user context), this doesn't include league-specific fields.
 */
final class AdminUpdateDriverData extends Data
{
    public function __construct(
        public readonly ?string $first_name,
        public readonly ?string $last_name,
        public readonly ?string $nickname,
        public readonly ?string $email,
        public readonly ?string $phone,
        public readonly ?string $psn_id,
        public readonly ?string $iracing_id,
        public readonly ?int $iracing_customer_id,
        public readonly ?string $discord_id,
    ) {
    }

    /**
     * Validation rules for updating driver (admin context).
     *
     * @return array<string, mixed>
     */
    public static function rules(): array
    {
        return [
            'first_name' => ['nullable', 'string', 'min:1', 'max:100'],
            'last_name' => ['nullable', 'string', 'min:1', 'max:100'],
            'nickname' => ['nullable', 'string', 'min:1', 'max:100'],
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'min:1', 'max:20'],
            'psn_id' => ['nullable', 'string', 'min:1', 'max:255'],
            'iracing_id' => ['nullable', 'string', 'min:1', 'max:255'],
            'iracing_customer_id' => ['nullable', 'integer', 'min:1'],
            'discord_id' => ['nullable', 'string', 'min:1', 'max:255'],
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
            'first_name.max' => 'First name must not exceed 100 characters',
            'last_name.max' => 'Last name must not exceed 100 characters',
            'nickname.max' => 'Nickname must not exceed 100 characters',
            'email.email' => 'Please enter a valid email address',
            'email.max' => 'Email must not exceed 255 characters',
            'phone.max' => 'Phone number must not exceed 20 characters',
            'psn_id.max' => 'PSN ID must not exceed 255 characters',
            'iracing_id.max' => 'iRacing ID must not exceed 255 characters',
            'iracing_customer_id.min' => 'iRacing Customer ID must be a positive number',
        ];
    }
}

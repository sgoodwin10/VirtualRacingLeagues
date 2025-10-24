<?php

declare(strict_types=1);

namespace App\Application\Driver\DTOs;

use Spatie\LaravelData\Data;

final class CreateDriverData extends Data
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
        public readonly ?int $driver_number,
        public readonly string $status = 'active',
        public readonly ?string $league_notes = null
    ) {
    }

    /**
     * Validation rules for creating a driver.
     *
     * @return array<string, mixed>
     */
    public static function rules(): array
    {
        return [
            // At least one name field required - validated at application layer
            'first_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'nickname' => ['nullable', 'string', 'max:100'],

            // Contact info (optional)
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],

            // At least one platform ID required - validated at application layer
            'psn_id' => ['nullable', 'string', 'max:255'],
            'iracing_id' => ['nullable', 'string', 'max:255'],
            'iracing_customer_id' => ['nullable', 'integer', 'min:1'],
            'discord_id' => ['nullable', 'string', 'max:255'],

            // League-specific fields
            'driver_number' => ['nullable', 'integer', 'min:1', 'max:999'],
            'status' => ['nullable', 'in:active,inactive,banned'],
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
            'email.email' => 'Please provide a valid email address',
            'driver_number.min' => 'Driver number must be between 1 and 999',
            'driver_number.max' => 'Driver number must be between 1 and 999',
            'iracing_customer_id.min' => 'iRacing customer ID must be a positive number',
        ];
    }

    /**
     * Get the effective nickname (auto-generated from Discord ID if not provided).
     */
    public function getEffectiveNickname(): ?string
    {
        // If nickname is provided and not empty, use it
        if ($this->nickname !== null && trim($this->nickname) !== '') {
            return $this->nickname;
        }

        // If no nickname and no first/last name but Discord ID is present, generate from Discord ID
        $hasFirstName = $this->first_name !== null && trim($this->first_name) !== '';
        $hasLastName = $this->last_name !== null && trim($this->last_name) !== '';
        $hasDiscordId = $this->discord_id !== null && trim($this->discord_id) !== '';

        if (!$hasFirstName && !$hasLastName && $hasDiscordId) {
            return $this->discord_id;
        }

        // Otherwise return the original nickname (null or empty)
        return $this->nickname;
    }
}

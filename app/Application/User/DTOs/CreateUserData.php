<?php

declare(strict_types=1);

namespace App\Application\User\DTOs;

use Spatie\LaravelData\Data;

/**
 * Data Transfer Object for creating a user.
 */
final class CreateUserData extends Data
{
    public function __construct(
        public readonly string $first_name,
        public readonly string $last_name,
        public readonly string $email,
        public readonly string $password,
        public readonly ?string $alias = null,
        public readonly ?string $uuid = null,
        public readonly string $status = 'active',
    ) {
    }

    /**
     * @return array<string, array<int, string>>
     */
    public static function rules(\Spatie\LaravelData\Support\Validation\ValidationContext $context = null): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8'],
            'alias' => ['nullable', 'string', 'max:100'],
            'uuid' => ['nullable', 'string', 'max:60'],
            'status' => ['nullable', 'in:active,inactive,suspended'],
        ];
    }
}

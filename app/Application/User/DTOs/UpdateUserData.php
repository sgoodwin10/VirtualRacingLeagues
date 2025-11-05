<?php

declare(strict_types=1);

namespace App\Application\User\DTOs;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * Data Transfer Object for updating a user.
 */
final class UpdateUserData extends Data
{
    public function __construct(
        public readonly string|Optional $first_name = new Optional(),
        public readonly string|Optional $last_name = new Optional(),
        public readonly string|Optional $email = new Optional(),
        public readonly string|null|Optional $password = new Optional(),
        public readonly string|null|Optional $alias = new Optional(),
        public readonly string|Optional $status = new Optional(),
    ) {
    }

    /**
     * @return array<string, array<int, string>>
     */
    public static function rules(?\Spatie\LaravelData\Support\Validation\ValidationContext $context = null): array
    {
        return [
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'password' => ['nullable', 'string', 'min:8'],
            'alias' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:active,inactive,suspended'],
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Application\Admin\DTOs;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * Data Transfer Object for updating an admin.
 */
final class UpdateAdminData extends Data
{
    public function __construct(
        public readonly string|Optional $first_name = new Optional(),
        public readonly string|Optional $last_name = new Optional(),
        public readonly string|Optional $email = new Optional(),
        public readonly string|Optional $password = new Optional(),
        public readonly string|Optional $role = new Optional(),
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
            'role' => ['nullable', 'in:super_admin,admin,moderator'],
            'status' => ['nullable', 'in:active,inactive'],
        ];
    }
}

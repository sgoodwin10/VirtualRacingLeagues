<?php

declare(strict_types=1);

namespace App\Application\Admin\DTOs;

use Spatie\LaravelData\Data;

/**
 * Data Transfer Object for creating an admin.
 */
final class CreateAdminData extends Data
{
    public function __construct(
        public readonly string $first_name,
        public readonly string $last_name,
        public readonly string $email,
        public readonly ?string $password = null,
        public readonly string $role = 'moderator',
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
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['required', 'in:super_admin,admin,moderator'],
        ];
    }
}

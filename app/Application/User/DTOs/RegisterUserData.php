<?php

declare(strict_types=1);

namespace App\Application\User\DTOs;

use Spatie\LaravelData\Data;

/**
 * DTO for user registration.
 */
class RegisterUserData extends Data
{
    public function __construct(
        public string $first_name,
        public string $last_name,
        public string $email,
        public string $password,
    ) {
    }
}

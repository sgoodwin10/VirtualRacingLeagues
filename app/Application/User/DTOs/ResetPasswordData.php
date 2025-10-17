<?php

declare(strict_types=1);

namespace App\Application\User\DTOs;

use Spatie\LaravelData\Data;

/**
 * DTO for resetting password.
 */
class ResetPasswordData extends Data
{
    public function __construct(
        public string $email,
        public string $token,
        public string $password,
        public ?string $password_confirmation = null,
    ) {
    }
}

<?php

declare(strict_types=1);

namespace App\Application\User\DTOs;

use Spatie\LaravelData\Data;

/**
 * DTO for updating user profile.
 */
class UpdateProfileData extends Data
{
    public function __construct(
        public string $first_name,
        public string $last_name,
        public string $email,
        public ?string $password = null,
        public ?string $password_confirmation = null,
        public ?string $current_password = null,
    ) {
    }
}

<?php

declare(strict_types=1);

namespace App\Application\User\DTOs;

use Spatie\LaravelData\Data;

/**
 * DTO for requesting password reset.
 */
class RequestPasswordResetData extends Data
{
    public function __construct(
        public string $email,
    ) {
    }
}

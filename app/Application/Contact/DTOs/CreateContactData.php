<?php

declare(strict_types=1);

namespace App\Application\Contact\DTOs;

use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;

final class CreateContactData extends Data
{
    public function __construct(
        #[Required, Max(255)]
        public readonly string $name,
        #[Required, Email, Max(255)]
        public readonly string $email,
        #[Required, In(['error', 'question', 'help', 'other'])]
        public readonly string $reason,
        #[Required, Max(2000)]
        public readonly string $message,
        #[Required, In(['app', 'public'])]
        public readonly string $source,
        public readonly bool $ccUser = false,
        public readonly ?int $userId = null,
        /** @var array<string, mixed> */
        public readonly array $metadata = [],
    ) {
    }
}

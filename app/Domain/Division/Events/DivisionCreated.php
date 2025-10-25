<?php

declare(strict_types=1);

namespace App\Domain\Division\Events;

/**
 * Event fired when a division is created.
 */
final readonly class DivisionCreated
{
    public function __construct(
        public int $divisionId,
        public int $seasonId,
        public string $name,
        public ?string $description,
        public ?string $logoUrl,
    ) {
    }
}

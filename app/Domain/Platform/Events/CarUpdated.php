<?php

declare(strict_types=1);

namespace App\Domain\Platform\Events;

/**
 * Domain Event: Car Updated.
 */
final readonly class CarUpdated
{
    /**
     * @param array<string, mixed> $changes
     */
    public function __construct(
        public int $carId,
        public array $changes,
    ) {
    }
}

<?php

declare(strict_types=1);

namespace App\Domain\Platform\Events;

/**
 * Domain Event: Car Created.
 */
final readonly class CarCreated
{
    public function __construct(
        public int $carId,
        public int $platformId,
        public string $externalId,
        public string $name,
        public string $slug,
    ) {
    }
}

<?php

declare(strict_types=1);

namespace App\Domain\Platform\Events;

/**
 * Domain Event: Car Deactivated.
 */
final readonly class CarDeactivated
{
    public function __construct(
        public int $carId,
        public int $platformId,
    ) {
    }
}

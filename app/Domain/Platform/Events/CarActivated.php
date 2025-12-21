<?php

declare(strict_types=1);

namespace App\Domain\Platform\Events;

/**
 * Domain Event: Car Activated.
 */
final readonly class CarActivated
{
    public function __construct(
        public int $carId,
        public int $platformId,
    ) {
    }
}

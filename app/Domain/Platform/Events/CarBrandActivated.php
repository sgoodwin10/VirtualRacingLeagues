<?php

declare(strict_types=1);

namespace App\Domain\Platform\Events;

/**
 * Domain Event: Car Brand Activated.
 */
final readonly class CarBrandActivated
{
    public function __construct(
        public int $brandId,
    ) {
    }
}

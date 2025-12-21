<?php

declare(strict_types=1);

namespace App\Domain\Platform\Events;

/**
 * Domain Event: CarBrand Created.
 */
final readonly class CarBrandCreated
{
    public function __construct(
        public int $brandId,
        public string $name,
        public string $slug,
    ) {
    }
}

<?php

declare(strict_types=1);

namespace App\Domain\Platform\Events;

/**
 * Domain Event: CarBrand Updated.
 */
final readonly class CarBrandUpdated
{
    /**
     * @param array<string, mixed> $changes
     */
    public function __construct(
        public int $brandId,
        public array $changes,
    ) {
    }
}

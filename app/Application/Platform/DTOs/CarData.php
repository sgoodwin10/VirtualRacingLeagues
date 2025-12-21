<?php

declare(strict_types=1);

namespace App\Application\Platform\DTOs;

use Spatie\LaravelData\Data;

/**
 * Car Data Transfer Object.
 */
final class CarData extends Data
{
    public function __construct(
        public int $id,
        public int $platformId,
        public int $carBrandId,
        public string $externalId,
        public string $name,
        public string $slug,
        public ?string $carGroup,
        public ?int $year,
        public ?string $imageUrl,
        public bool $isActive,
        public int $sortOrder,
        public string $createdAt,
        public string $updatedAt,
        public ?CarBrandData $brand = null,
    ) {
    }
}

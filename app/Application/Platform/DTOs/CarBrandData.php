<?php

declare(strict_types=1);

namespace App\Application\Platform\DTOs;

use Spatie\LaravelData\Data;

/**
 * CarBrand Data Transfer Object.
 */
final class CarBrandData extends Data
{
    public function __construct(
        public int $id,
        public string $name,
        public string $slug,
        public ?string $logoUrl,
        public bool $isActive,
        public int $sortOrder,
        public string $createdAt,
        public string $updatedAt,
    ) {
    }
}

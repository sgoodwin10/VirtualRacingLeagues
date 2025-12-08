<?php

declare(strict_types=1);

namespace App\Application\Platform\DTOs;

use Spatie\LaravelData\Data;

/**
 * Platform Data Transfer Object.
 * Represents platform information for application layer operations.
 */
final class PlatformData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly string $slug,
    ) {
    }

    /**
     * Create from repository array data.
     *
     * @param array{id: int, name: string, slug: string} $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            name: $data['name'],
            slug: $data['slug'],
        );
    }
}

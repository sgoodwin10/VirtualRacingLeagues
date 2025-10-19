<?php

declare(strict_types=1);

namespace App\Application\League\DTOs;

use Spatie\LaravelData\Data;

final class LeaguePlatformData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $description,
        public readonly ?string $logo_url,
    ) {
    }

    /**
     * Create from array (typically from repository).
     *
     * @param array{id: int, name: string, slug: string, description: ?string, logo_url: ?string} $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            name: $data['name'],
            slug: $data['slug'],
            description: $data['description'] ?? null,
            logo_url: $data['logo_url'] ?? null,
        );
    }
}

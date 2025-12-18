<?php

declare(strict_types=1);

namespace App\Domain\Shared\ValueObjects;

/**
 * MediaReference Value Object
 *
 * Represents a reference to a media file managed by Spatie Media Library.
 * This is a pure PHP value object with no Laravel dependencies.
 *
 * The 'id' references the primary key in Spatie's media table.
 * Spatie handles the polymorphic relationship (model_type, model_id) automatically.
 */
final readonly class MediaReference
{
    /**
     * @param int $id The media table primary key
     * @param string $collection The media collection name (e.g., 'logo', 'banner')
     * @param array<string, string> $conversions URLs for each image conversion (thumb, small, medium, large, og)
     */
    public function __construct(
        public int $id,
        public string $collection,
        public array $conversions = [],
    ) {
    }

    /**
     * Convert to array representation
     *
     * @return array{id: int, collection: string, conversions: array<string, string>}
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'collection' => $this->collection,
            'conversions' => $this->conversions,
        ];
    }

    /**
     * Create from array representation
     *
     * @param array{id: int, collection: string, conversions?: array<string, string>} $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            collection: $data['collection'],
            conversions: $data['conversions'] ?? [],
        );
    }
}

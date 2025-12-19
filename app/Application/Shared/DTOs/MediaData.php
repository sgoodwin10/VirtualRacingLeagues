<?php

declare(strict_types=1);

namespace App\Application\Shared\DTOs;

use Spatie\LaravelData\Data;

/**
 * Media DTO - represents a Spatie media object with conversions.
 * Used for images with responsive conversions (thumb, small, medium, large, og).
 */
final class MediaData extends Data
{
    /**
     * @param int $id Media ID
     * @param string $original Original image URL
     * @param array<string, string> $conversions Conversion URLs (thumb, small, medium, large, og)
     * @param string $srcset Responsive srcset string for <img> tags
     */
    public function __construct(
        public readonly int $id,
        public readonly string $original,
        public readonly array $conversions,
        public readonly string $srcset,
    ) {
    }

    /**
     * Create from array data.
     * Useful when you have media data already converted to array format.
     *
     * @param array{id: int, original: string, conversions: array<string, string>, srcset: string} $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            original: $data['original'],
            conversions: $data['conversions'],
            srcset: $data['srcset'],
        );
    }
}

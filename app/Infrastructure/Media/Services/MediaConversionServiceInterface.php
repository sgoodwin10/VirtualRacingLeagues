<?php

declare(strict_types=1);

namespace App\Infrastructure\Media\Services;

use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Service for converting Spatie Media models to array representations.
 */
interface MediaConversionServiceInterface
{
    /**
     * Convert Spatie Media model to array representation with all conversions and srcset.
     *
     * @param Media|null $media The media model to convert
     * @return array{id: int, original: string, conversions: array<string, string>, srcset: string}|null
     */
    public function mediaToArray(?Media $media): ?array;
}

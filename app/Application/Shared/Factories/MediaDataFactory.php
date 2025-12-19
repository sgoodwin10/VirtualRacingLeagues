<?php

declare(strict_types=1);

namespace App\Application\Shared\Factories;

use App\Application\Shared\DTOs\MediaData;
use App\Infrastructure\Media\Services\MediaConversionServiceInterface;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Factory for creating MediaData DTOs from Spatie Media models.
 * Removes service locator anti-pattern from DTOs by properly injecting dependencies.
 */
final class MediaDataFactory
{
    public function __construct(
        private readonly MediaConversionServiceInterface $conversionService
    ) {
    }

    /**
     * Create MediaData from Spatie Media model.
     * Returns null if media is null or conversion fails.
     */
    public function fromMedia(?Media $media): ?MediaData
    {
        if ($media === null) {
            return null;
        }

        $mediaArray = $this->conversionService->mediaToArray($media);

        if ($mediaArray === null) {
            return null;
        }

        return new MediaData(
            id: $mediaArray['id'],
            original: $mediaArray['original'],
            conversions: $mediaArray['conversions'],
            srcset: $mediaArray['srcset'],
        );
    }
}

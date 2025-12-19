<?php

declare(strict_types=1);

namespace App\Infrastructure\Media\Services;

use Illuminate\Support\Facades\Log;
use Spatie\MediaLibrary\MediaCollections\Exceptions\InvalidConversion;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Service for converting Spatie Media models to array representations.
 * Provides consistent media conversion across all application services.
 */
final class MediaConversionService implements MediaConversionServiceInterface
{
    /**
     * Supported image conversion sizes.
     *
     * @var array<string>
     */
    private const CONVERSION_NAMES = ['thumb', 'small', 'medium', 'large', 'og'];

    /**
     * Srcset width mappings for responsive images.
     *
     * @var array<string, string>
     */
    private const SRCSET_WIDTHS = [
        'thumb' => '150w',
        'small' => '320w',
        'medium' => '640w',
        'large' => '1280w',
    ];

    /**
     * Convert Spatie Media model to array representation with all conversions and srcset.
     *
     * This method:
     * - Returns null for null input
     * - Generates URLs for all available conversions (thumb, small, medium, large, og)
     * - Handles missing conversions gracefully with logging
     * - Generates responsive image srcset for web use
     *
     * @param Media|null $media The media model to convert
     * @return array{id: int, original: string, conversions: array<string, string>, srcset: string}|null
     */
    public function mediaToArray(?Media $media): ?array
    {
        if ($media === null) {
            return null;
        }

        $conversions = [];

        foreach (self::CONVERSION_NAMES as $conversion) {
            // Check if conversion has been generated before attempting to get URL
            if ($media->hasGeneratedConversion($conversion)) {
                try {
                    $conversions[$conversion] = $media->getUrl($conversion);
                } catch (InvalidConversion $e) {
                    // Conversion doesn't exist (expected for optional conversions)
                    Log::debug('Media conversion not available', [
                        'media_id' => $media->getKey(),
                        'conversion' => $conversion,
                        'message' => $e->getMessage(),
                    ]);
                } catch (\Exception $e) {
                    // Unexpected exception - log as warning
                    Log::warning('Unexpected error retrieving media conversion', [
                        'media_id' => $media->getKey(),
                        'conversion' => $conversion,
                        'exception' => get_class($e),
                        'message' => $e->getMessage(),
                    ]);
                }
            }
        }

        // Generate srcset for responsive images
        $srcsetParts = [];

        foreach (self::SRCSET_WIDTHS as $conversionName => $width) {
            if (isset($conversions[$conversionName])) {
                $srcsetParts[] = "{$conversions[$conversionName]} {$width}";
            }
        }

        return [
            'id' => (int) $media->getKey(),
            'original' => $media->getUrl(),
            'conversions' => $conversions,
            'srcset' => implode(', ', $srcsetParts),
        ];
    }
}

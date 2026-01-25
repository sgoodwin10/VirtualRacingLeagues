<?php

declare(strict_types=1);

namespace App\Application\League\Traits;

use Illuminate\Support\Facades\Log;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Trait for converting Spatie Media models to array representations.
 *
 * Provides consistent media conversion across League DTOs.
 */
trait MediaArrayConversion
{
    /**
     * Convert Spatie Media model to array representation with conversions and srcset.
     *
     * @return array{id: int, original: string, conversions: array<string, string>, srcset: string}|null
     */
    protected static function mediaToArray(?Media $media): ?array
    {
        if ($media === null) {
            return null;
        }

        $conversions = [];
        $conversionNames = ['thumb', 'small', 'medium', 'large', 'og'];

        // Get generated conversions from the media model
        // This is an array of conversion names that have actually been generated
        $generatedConversions = $media->generated_conversions ?? [];

        foreach ($conversionNames as $conversion) {
            // Only include conversions that have actually been generated
            // Check if the conversion is in the generated_conversions array and is truthy
            if (isset($generatedConversions[$conversion]) && $generatedConversions[$conversion]) {
                try {
                    $conversions[$conversion] = $media->getUrl($conversion);
                } catch (\Exception $e) {
                    // Conversion may not be accessible despite being marked as generated
                    Log::debug('Media conversion not available', [
                        'media_id' => $media->getKey(),
                        'conversion' => $conversion,
                        'error' => $e->getMessage(),
                    ]);
                }
            } else {
                // Conversion not yet generated (likely queued)
                Log::debug('Media conversion not yet generated', [
                    'media_id' => $media->getKey(),
                    'conversion' => $conversion,
                ]);
            }
        }

        // Generate srcset for responsive images (only for generated conversions)
        $srcsetParts = [];
        $widths = [
            'thumb' => '150w',
            'small' => '320w',
            'medium' => '640w',
            'large' => '1280w',
        ];

        foreach ($widths as $conversionName => $width) {
            if (isset($conversions[$conversionName])) {
                $srcsetParts[] = "{$conversions[$conversionName]} {$width}";
            }
        }

        return [
            'id' => $media->getKey(),
            'original' => $media->getUrl(),
            'conversions' => $conversions,
            'srcset' => implode(', ', $srcsetParts),
        ];
    }
}

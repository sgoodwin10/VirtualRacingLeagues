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
     * @param Media|null $media
     * @return array{id: int, original: string, conversions: array<string, string>, srcset: string}|null
     */
    protected static function mediaToArray(?Media $media): ?array
    {
        if ($media === null) {
            return null;
        }

        $conversions = [];
        $conversionNames = ['thumb', 'small', 'medium', 'large', 'og'];

        foreach ($conversionNames as $conversion) {
            try {
                $conversions[$conversion] = $media->getUrl($conversion);
            } catch (\Exception $e) {
                // Conversion may not exist yet (queued) or may not apply to this file type
                Log::debug('Media conversion not available', [
                    'media_id' => $media->getKey(),
                    'conversion' => $conversion,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Generate srcset for responsive images
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

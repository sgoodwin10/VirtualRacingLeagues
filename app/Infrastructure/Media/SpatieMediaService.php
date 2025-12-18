<?php

declare(strict_types=1);

namespace App\Infrastructure\Media;

use App\Application\Shared\Services\MediaServiceInterface;
use App\Domain\Shared\ValueObjects\MediaReference;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\MediaCollections\Exceptions\FileCannotBeAdded;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * SpatieMediaService
 *
 * Infrastructure implementation of MediaServiceInterface using Spatie Media Library.
 * Wraps Spatie's functionality to provide a clean interface for the application layer.
 */
class SpatieMediaService implements MediaServiceInterface
{
    /**
     * Upload a file and attach it to a model
     *
     * @param UploadedFile $file The uploaded file
     * @param HasMedia $model The Eloquent model implementing HasMedia interface
     * @param string $collection The media collection name
     * @return MediaReference
     * @throws \Exception If upload fails
     */
    public function upload(
        UploadedFile $file,
        object $model,
        string $collection = 'default'
    ): MediaReference {
        assert($model instanceof HasMedia);
        try {
            // Delete existing media in the same collection (e.g., replace logo)
            $model->clearMediaCollection($collection);

            // Upload new media
            $media = $model
                ->addMedia($file)
                ->toMediaCollection($collection);

            return new MediaReference(
                id: $media->getKey(),
                collection: $collection,
                conversions: $this->getConversionUrls($media),
            );
        } catch (FileCannotBeAdded $e) {
            Log::error('Media upload failed', [
                'model' => get_class($model),
                'collection' => $collection,
                'error' => $e->getMessage(),
            ]);

            throw new \Exception('Failed to upload file: ' . $e->getMessage());
        }
    }

    /**
     * Delete media by reference
     *
     * @param MediaReference $reference
     * @return bool
     */
    public function delete(MediaReference $reference): bool
    {
        try {
            /** @var Media|null $media */
            $media = Media::query()->find($reference->id);

            if ($media === null) {
                return false;
            }

            $media->delete();

            return true;
        } catch (\Exception $e) {
            Log::error('Media deletion failed', [
                'media_id' => $reference->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Get URL for a media file
     *
     * @param MediaReference $reference
     * @param string $conversion
     * @return string
     */
    public function getUrl(
        MediaReference $reference,
        string $conversion = ''
    ): string {
        /** @var Media $media */
        $media = Media::query()->findOrFail($reference->id);

        return $conversion !== ''
            ? $media->getUrl($conversion)
            : $media->getUrl();
    }

    /**
     * Get responsive URLs for all conversions
     *
     * @param MediaReference $reference
     * @return array{original: string, conversions: array<string, string>, srcset: string}
     */
    public function getResponsiveUrls(MediaReference $reference): array
    {
        /** @var Media $media */
        $media = Media::query()->findOrFail($reference->id);

        $conversions = $this->getConversionUrls($media);

        return [
            'original' => $media->getUrl(),
            'conversions' => $conversions,
            'srcset' => $this->generateSrcset($conversions),
        ];
    }

    /**
     * Get conversion URLs from a Media model
     *
     * @param Media $media
     * @return array<string, string>
     */
    private function getConversionUrls(Media $media): array
    {
        $conversions = [];
        $conversionNames = ['thumb', 'small', 'medium', 'large', 'og'];

        foreach ($conversionNames as $conversion) {
            try {
                $conversions[$conversion] = $media->getUrl($conversion);
            } catch (\Exception $e) {
                // Conversion may not exist yet (queued) or may not apply to this file type
                // Log but continue
                Log::debug('Conversion not available', [
                    'media_id' => $media->getKey(),
                    'conversion' => $conversion,
                ]);
            }
        }

        return $conversions;
    }

    /**
     * Generate srcset string for responsive images
     *
     * @param array<string, string> $conversions
     * @return string
     */
    private function generateSrcset(array $conversions): string
    {
        $srcsetParts = [];
        $widths = [
            'thumb' => '150w',
            'small' => '320w',
            'medium' => '640w',
            'large' => '1280w',
        ];

        foreach ($widths as $conversion => $width) {
            if (isset($conversions[$conversion])) {
                $srcsetParts[] = "{$conversions[$conversion]} {$width}";
            }
        }

        return implode(', ', $srcsetParts);
    }
}

<?php

declare(strict_types=1);

namespace App\Infrastructure\Media;

use App\Application\Shared\Services\MediaServiceInterface;
use App\Domain\Shared\ValueObjects\MediaReference;
use App\Infrastructure\Media\Services\MediaConversionServiceInterface;
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
    public function __construct(
        private readonly MediaConversionServiceInterface $conversionService
    ) {
    }

    /**
     * Upload a file and attach it to a model
     *
     * @param  UploadedFile  $file  The uploaded file
     * @param  HasMedia  $model  The Eloquent model implementing HasMedia interface
     * @param  string  $collection  The media collection name
     *
     * @throws \Exception If upload fails
     */
    public function upload(
        UploadedFile $file,
        object $model,
        string $collection = 'default'
    ): MediaReference {
        if (! $model instanceof HasMedia) {
            throw new \InvalidArgumentException(
                sprintf('Model %s must implement HasMedia interface', get_class($model))
            );
        }

        try {
            // Get existing media before upload to prevent race condition
            /** @var Media|null $existingMedia */
            $existingMedia = $model->getFirstMedia($collection);

            // Upload new media first (don't delete old media until upload succeeds)
            $media = $model
                ->addMedia($file)
                ->toMediaCollection($collection);

            // Only delete old media after successful upload
            if ($existingMedia !== null && $existingMedia->getKey() !== $media->getKey()) {
                $existingMedia->delete();
            }

            // Use MediaConversionService to get conversions
            $mediaArray = $this->conversionService->mediaToArray($media);
            $conversions = $mediaArray !== null ? $mediaArray['conversions'] : [];

            return new MediaReference(
                id: $media->getKey(),
                collection: $collection,
                conversions: $conversions,
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
     * @return array{original: string, conversions: array<string, string>, srcset: string}
     */
    public function getResponsiveUrls(MediaReference $reference): array
    {
        /** @var Media $media */
        $media = Media::query()->findOrFail($reference->id);

        // Use MediaConversionService for consistent conversion logic
        $mediaArray = $this->conversionService->mediaToArray($media);

        if ($mediaArray === null) {
            return [
                'original' => '',
                'conversions' => [],
                'srcset' => '',
            ];
        }

        return [
            'original' => $mediaArray['original'],
            'conversions' => $mediaArray['conversions'],
            'srcset' => $mediaArray['srcset'],
        ];
    }
}

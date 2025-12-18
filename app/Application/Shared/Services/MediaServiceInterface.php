<?php

declare(strict_types=1);

namespace App\Application\Shared\Services;

use App\Domain\Shared\ValueObjects\MediaReference;
use Illuminate\Http\UploadedFile;

/**
 * MediaServiceInterface
 *
 * Defines the contract for media management operations.
 * Implementation should wrap Spatie Media Library functionality.
 */
interface MediaServiceInterface
{
    /**
     * Upload a file and attach it to a model
     *
     * @param UploadedFile $file The uploaded file
     * @param object $model The Eloquent model implementing HasMedia interface
     * @param string $collection The media collection name (e.g., 'logo', 'banner', 'header')
     * @return MediaReference The media reference containing ID and conversion URLs
     * @throws \Spatie\MediaLibrary\MediaCollections\Exceptions\FileCannotBeAdded
     */
    public function upload(
        UploadedFile $file,
        object $model,
        string $collection = 'default'
    ): MediaReference;

    /**
     * Delete media by reference
     *
     * @param MediaReference $reference The media reference
     * @return bool True if deleted successfully
     */
    public function delete(MediaReference $reference): bool;

    /**
     * Get URL for a media file
     *
     * @param MediaReference $reference The media reference
     * @param string $conversion The conversion name (empty for original)
     * @return string The media URL
     */
    public function getUrl(
        MediaReference $reference,
        string $conversion = ''
    ): string;

    /**
     * Get responsive URLs for all conversions
     *
     * @param MediaReference $reference The media reference
     * @return array{original: string, conversions: array<string, string>, srcset: string}
     */
    public function getResponsiveUrls(MediaReference $reference): array;
}

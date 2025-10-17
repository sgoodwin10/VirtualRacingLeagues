<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\SiteConfig\Exceptions\FileUploadException;
use App\Domain\SiteConfig\Repositories\FileStorageServiceInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Local file storage implementation.
 * Can be easily swapped with S3FileStorageService or CloudflareR2FileStorageService.
 */
class LocalFileStorageService implements FileStorageServiceInterface
{
    /**
     * Store an uploaded file.
     *
     * @return array{path: string, url: string}
     *
     * @throws FileUploadException
     */
    public function store(UploadedFile $file, string $directory, string $disk = 'public'): array
    {
        try {
            $fileName = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs($directory, $fileName, $disk);

            if ($path === false) {
                throw FileUploadException::uploadFailed('Failed to store file');
            }

            $url = Storage::disk($disk)->url($path);

            return [
                'path' => $path,
                'url' => $url,
            ];
        } catch (\Exception $e) {
            throw FileUploadException::uploadFailed($e->getMessage());
        }
    }

    /**
     * Delete a file.
     *
     * @throws FileUploadException
     */
    public function delete(string $path, string $disk = 'public'): bool
    {
        try {
            if (! $this->exists($path, $disk)) {
                throw FileUploadException::fileNotFound($path);
            }

            return Storage::disk($disk)->delete($path);
        } catch (\Exception $e) {
            throw FileUploadException::deleteFailed($path, $e->getMessage());
        }
    }

    /**
     * Check if a file exists.
     */
    public function exists(string $path, string $disk = 'public'): bool
    {
        return Storage::disk($disk)->exists($path);
    }

    /**
     * Get the public URL for a file.
     */
    public function url(string $path, string $disk = 'public'): string
    {
        return Storage::disk($disk)->url($path);
    }

    /**
     * Get the size of a file in bytes.
     */
    public function size(string $path, string $disk = 'public'): int
    {
        return Storage::disk($disk)->size($path);
    }
}

<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\FileStorage;

use App\Domain\SiteConfig\Exceptions\FileUploadException;
use Illuminate\Http\UploadedFile;

/**
 * Storage-agnostic file storage interface.
 * Allows easy switching between local, S3, CloudFlare R2, etc.
 */
interface FileStorageServiceInterface
{
    /**
     * Store an uploaded file.
     *
     * @param  UploadedFile  $file  The uploaded file
     * @param  string  $directory  The directory to store the file in
     * @param  string  $disk  The storage disk to use
     * @return array{path: string, url: string} The stored file path and public URL
     *
     * @throws FileUploadException
     */
    public function store(UploadedFile $file, string $directory, string $disk = 'public'): array;

    /**
     * Delete a file.
     *
     * @param  string  $path  The file path
     * @param  string  $disk  The storage disk
     *
     * @throws FileUploadException
     */
    public function delete(string $path, string $disk = 'public'): bool;

    /**
     * Check if a file exists.
     *
     * @param  string  $path  The file path
     * @param  string  $disk  The storage disk
     */
    public function exists(string $path, string $disk = 'public'): bool;

    /**
     * Get the public URL for a file.
     *
     * @param  string  $path  The file path
     * @param  string  $disk  The storage disk
     */
    public function url(string $path, string $disk = 'public'): string;

    /**
     * Get the size of a file in bytes.
     *
     * @param  string  $path  The file path
     * @param  string  $disk  The storage disk
     */
    public function size(string $path, string $disk = 'public'): int;
}

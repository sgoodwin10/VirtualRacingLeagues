<?php

declare(strict_types=1);

namespace App\Domain\SiteConfig\Exceptions;

use Exception;

class FileUploadException extends Exception
{
    /**
     * @param  array<string>  $allowedTypes
     */
    public static function invalidFileType(string $fileType, array $allowedTypes): self
    {
        $allowed = implode(', ', $allowedTypes);

        return new self("Invalid file type '{$fileType}'. Allowed types: {$allowed}");
    }

    public static function fileTooLarge(int $fileSize, int $maxSize): self
    {
        $fileSizeMB = round($fileSize / 1024 / 1024, 2);
        $maxSizeMB = round($maxSize / 1024 / 1024, 2);

        return new self("File size {$fileSizeMB}MB exceeds maximum allowed size of {$maxSizeMB}MB");
    }

    public static function uploadFailed(string $reason): self
    {
        return new self("File upload failed: {$reason}");
    }

    public static function deleteFailed(string $filePath, string $reason): self
    {
        return new self("Failed to delete file '{$filePath}': {$reason}");
    }

    public static function fileNotFound(string $filePath): self
    {
        return new self("File not found: {$filePath}");
    }

    public static function invalidFileTypeEnum(string $type): self
    {
        return new self("Invalid file type enum: {$type}. Must be 'logo', 'favicon', or 'og_image'");
    }
}

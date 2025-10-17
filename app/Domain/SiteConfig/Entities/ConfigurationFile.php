<?php

declare(strict_types=1);

namespace App\Domain\SiteConfig\Entities;

use App\Domain\SiteConfig\Exceptions\FileUploadException;

/**
 * Domain Entity representing a configuration file (logo, favicon, og_image).
 */
class ConfigurationFile
{
    private const ALLOWED_TYPES = ['logo', 'favicon', 'og_image'];

    private const MAX_SIZES = [
        'logo' => 2 * 1024 * 1024, // 2MB
        'favicon' => 512 * 1024,   // 512KB
        'og_image' => 2 * 1024 * 1024, // 2MB
    ];

    private const ALLOWED_MIMES = [
        'logo' => ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'],
        'favicon' => ['image/x-icon', 'image/png'],
        'og_image' => ['image/png', 'image/jpeg', 'image/jpg'],
    ];

    public function __construct(
        private ?int $id,
        private int $siteConfigId,
        private string $fileType,
        private string $fileName,
        private string $filePath,
        private string $storageDisk,
        private string $mimeType,
        private int $fileSize,
    ) {
        $this->validateFileType();
        $this->validateFileSize();
        $this->validateMimeType();
    }

    private function validateFileType(): void
    {
        if (! in_array($this->fileType, self::ALLOWED_TYPES, true)) {
            throw FileUploadException::invalidFileTypeEnum($this->fileType);
        }
    }

    private function validateFileSize(): void
    {
        $maxSize = self::MAX_SIZES[$this->fileType] ?? 2 * 1024 * 1024;

        if ($this->fileSize > $maxSize) {
            throw FileUploadException::fileTooLarge($this->fileSize, $maxSize);
        }
    }

    private function validateMimeType(): void
    {
        $allowedMimes = self::ALLOWED_MIMES[$this->fileType] ?? [];

        if (! in_array($this->mimeType, $allowedMimes, true)) {
            throw FileUploadException::invalidFileType($this->mimeType, $allowedMimes);
        }
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSiteConfigId(): int
    {
        return $this->siteConfigId;
    }

    public function getFileType(): string
    {
        return $this->fileType;
    }

    public function getFileName(): string
    {
        return $this->fileName;
    }

    public function getFilePath(): string
    {
        return $this->filePath;
    }

    public function getStorageDisk(): string
    {
        return $this->storageDisk;
    }

    public function getMimeType(): string
    {
        return $this->mimeType;
    }

    public function getFileSize(): int
    {
        return $this->fileSize;
    }

    public function isWithinSizeLimit(): bool
    {
        $maxSize = self::MAX_SIZES[$this->fileType] ?? 2 * 1024 * 1024;
        return $this->fileSize <= $maxSize;
    }

    public function getPublicUrl(): string
    {
        // This will be replaced with actual storage URL generation in infrastructure layer
        return "/storage/{$this->filePath}";
    }

    /**
     * Get maximum allowed size for a file type in bytes.
     */
    public static function getMaxSizeForType(string $fileType): int
    {
        return self::MAX_SIZES[$fileType] ?? 2 * 1024 * 1024;
    }

    /**
     * Get allowed MIME types for a file type.
     *
     * @return array<int, string>
     */
    public static function getAllowedMimesForType(string $fileType): array
    {
        return self::ALLOWED_MIMES[$fileType] ?? [];
    }

    /**
     * Check if file type is valid.
     */
    public static function isValidFileType(string $fileType): bool
    {
        return in_array($fileType, self::ALLOWED_TYPES, true);
    }
}

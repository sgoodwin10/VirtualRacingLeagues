<?php

declare(strict_types=1);

namespace App\Application\Admin\DTOs;

use App\Domain\SiteConfig\Entities\ConfigurationFile;
use Illuminate\Support\Facades\Storage;
use Spatie\LaravelData\Data;

class SiteConfigFileData extends Data
{
    public function __construct(
        public readonly ?int $id,
        public readonly string $file_type,
        public readonly string $file_name,
        public readonly string $url,
        public readonly string $mime_type,
        public readonly int $file_size,
    ) {
    }

    /**
     * Create SiteConfigFileData from ConfigurationFile entity.
     */
    public static function fromEntity(ConfigurationFile $file): self
    {
        $disk = Storage::disk($file->getStorageDisk());
        // Use path() method which is available on FilesystemAdapter
        $url = method_exists($disk, 'url') ? $disk->url($file->getFilePath()) : '';

        return new self(
            id: $file->getId(),
            file_type: $file->getFileType(),
            file_name: $file->getFileName(),
            url: $url,
            mime_type: $file->getMimeType(),
            file_size: $file->getFileSize(),
        );
    }
}

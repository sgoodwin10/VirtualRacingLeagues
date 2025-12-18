# Media Management Backend Implementation Plan

> **Document Version:** 1.0
> **Created:** December 2024
> **Status:** Implementation Plan
> **Agent:** `dev-be` (Laravel Backend Expert)
> **Parent Document:** [01-media-management-architecture-plan.md](./01-media-management-architecture-plan.md)

## Table of Contents

1. [Overview](#1-overview)
2. [Phase 1: Foundation](#2-phase-1-foundation)
3. [Phase 2: League Integration (Pilot)](#3-phase-2-league-integration-pilot)
4. [Phase 3: Remaining Entities](#4-phase-3-remaining-entities)
5. [Phase 4: Data Migration](#5-phase-4-data-migration)
6. [API Response Contracts](#6-api-response-contracts)
7. [Testing Requirements](#7-testing-requirements)
8. [File Reference](#8-file-reference)

---

## 1. Overview

This document provides the detailed backend implementation plan for the Media Management feature. The backend work is the foundation that all frontend work depends on.

### Current State Analysis

Based on codebase research, the current state is:

| Entity | Current Approach | Service Used | Storage Pattern |
|--------|------------------|--------------|-----------------|
| League | `logo_path`, `header_image_path`, `banner_path` in DB | `Storage::put()` directly | `leagues/logos/`, `leagues/headers/`, `leagues/banners/` |
| Season | `logo_path`, `banner_path` in DB | `Storage::put()` directly | `seasons/{id}/` |
| Competition | `logo_path` in DB | `Storage::put()` directly | `competitions/logos/` |
| Team | `logo_url` in DB (stores full URL) | Direct URL storage | N/A - anomaly |
| Division | `logo_path` in DB | TBD | TBD |
| SiteConfig | `SiteConfigFileModel` with metadata | `FileStorageServiceInterface` | `site-config/` |

**Key Files Identified:**

- `app/Infrastructure/Persistence/FileStorage/FileStorageServiceInterface.php`
- `app/Infrastructure/Persistence/FileStorage/LocalFileStorageService.php`
- `app/Application/League/Services/LeagueApplicationService.php`
- `app/Application/Competition/Services/SeasonApplicationService.php`
- `app/Application/Competition/Services/CompetitionApplicationService.php`
- `app/Infrastructure/Persistence/Eloquent/Models/League.php`
- `app/Infrastructure/Persistence/Eloquent/Models/SeasonEloquent.php`
- `app/Infrastructure/Persistence/Eloquent/Models/Competition.php`
- `app/Infrastructure/Persistence/Eloquent/Models/Team.php`

---

## 2. Phase 1: Foundation

### 2.1 Install Spatie Media Library

**Commands:**
```bash
composer require spatie/laravel-medialibrary
php artisan vendor:publish --provider="Spatie\MediaLibrary\MediaLibraryServiceProvider" --tag="medialibrary-migrations"
php artisan vendor:publish --provider="Spatie\MediaLibrary\MediaLibraryServiceProvider" --tag="medialibrary-config"
php artisan migrate
php artisan storage:link  # If not already done
```

**Optional (recommended):**
```bash
composer require spatie/image-optimizer
```

### 2.2 Configure Media Library

**File:** `config/media-library.php`

```php
<?php

return [
    /*
     * The disk on which to store added files and derived images by default.
     * Choose one from 'disks' in config/filesystems.php
     */
    'disk_name' => env('MEDIA_DISK', 'public'),

    /*
     * The maximum file size of an item in bytes.
     * Adding a larger file will result in an exception.
     */
    'max_file_size' => 1024 * 1024 * 10, // 10MB

    /*
     * Queue configuration for async conversions
     */
    'queue_connection_name' => env('MEDIA_QUEUE_CONNECTION', 'redis'),
    'queue_name' => 'media-conversions',
    'queue_conversions_by_default' => true,

    /*
     * The class that contains the strategy for determining a media file's path.
     */
    'path_generator' => Spatie\MediaLibrary\Support\PathGenerator\DefaultPathGenerator::class,

    /*
     * When urls to files get generated, this class will be called.
     */
    'url_generator' => Spatie\MediaLibrary\Support\UrlGenerator\DefaultUrlGenerator::class,

    /*
     * Image optimizers configuration
     */
    'image_optimizers' => [
        Spatie\ImageOptimizer\Optimizers\Jpegoptim::class => [
            '-m85',
            '--strip-all',
            '--all-progressive',
        ],
        Spatie\ImageOptimizer\Optimizers\Pngquant::class => [
            '--force',
        ],
        Spatie\ImageOptimizer\Optimizers\Optipng::class => [
            '-i0',
            '-o2',
            '-quiet',
        ],
        Spatie\ImageOptimizer\Optimizers\Gifsicle::class => [
            '-b',
            '-O3',
        ],
    ],

    /*
     * Image generators
     */
    'image_generators' => [
        Spatie\MediaLibrary\Conversions\ImageGenerators\Image::class,
        Spatie\MediaLibrary\Conversions\ImageGenerators\Webp::class,
        Spatie\MediaLibrary\Conversions\ImageGenerators\Pdf::class,
        Spatie\MediaLibrary\Conversions\ImageGenerators\Svg::class,
    ],

    /*
     * FFMPEG path (for video thumbnails - future)
     */
    'ffmpeg_path' => env('FFMPEG_PATH', '/usr/bin/ffmpeg'),
    'ffprobe_path' => env('FFPROBE_PATH', '/usr/bin/ffprobe'),

    /*
     * Responsive images configuration
     */
    'responsive_images' => [
        'use_tiny_placeholders' => true,
        'tiny_placeholder_generator' => Spatie\MediaLibrary\ResponsiveImages\TinyPlaceholderGenerator\Blurred::class,
    ],
];
```

### 2.3 Create MediaReference Value Object

**File:** `app/Domain/Shared/ValueObjects/MediaReference.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Shared\ValueObjects;

/**
 * Value object representing a reference to a media item in the domain layer.
 *
 * This is a pure PHP value object with no Laravel dependencies.
 * The `id` references Spatie's media table primary key.
 */
final class MediaReference
{
    /**
     * @param int $id The media ID from Spatie's media table
     * @param string $collection The collection name (e.g., 'logo', 'banner')
     * @param array<string, string> $conversions Map of conversion name to URL
     */
    public function __construct(
        public readonly int $id,
        public readonly string $collection,
        public readonly array $conversions = [],
    ) {}

    /**
     * @return array{id: int, collection: string, conversions: array<string, string>}
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'collection' => $this->collection,
            'conversions' => $this->conversions,
        ];
    }

    /**
     * @param array{id: int, collection: string, conversions?: array<string, string>} $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            collection: $data['collection'],
            conversions: $data['conversions'] ?? [],
        );
    }

    public function equals(MediaReference $other): bool
    {
        return $this->id === $other->id
            && $this->collection === $other->collection;
    }
}
```

### 2.4 Create MediaServiceInterface

**File:** `app/Application/Shared/Services/MediaServiceInterface.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\Shared\Services;

use App\Domain\Shared\ValueObjects\MediaReference;
use Illuminate\Http\UploadedFile;
use Spatie\MediaLibrary\HasMedia;

interface MediaServiceInterface
{
    /**
     * Upload a file and attach it to a model.
     *
     * @param UploadedFile $file The uploaded file
     * @param HasMedia $model The model to attach media to (must implement HasMedia)
     * @param string $collection The collection name (e.g., 'logo', 'banner')
     * @return MediaReference The reference to the uploaded media
     * @throws \App\Domain\Shared\Exceptions\MediaUploadException
     */
    public function upload(
        UploadedFile $file,
        HasMedia $model,
        string $collection = 'default'
    ): MediaReference;

    /**
     * Delete a media item by its reference.
     *
     * @param MediaReference $reference The media reference
     * @return bool True if deleted successfully
     */
    public function delete(MediaReference $reference): bool;

    /**
     * Delete all media from a collection for a model.
     *
     * @param HasMedia $model The model
     * @param string $collection The collection name
     * @return bool True if deleted successfully
     */
    public function deleteCollection(HasMedia $model, string $collection): bool;

    /**
     * Get the URL for a media item.
     *
     * @param MediaReference $reference The media reference
     * @param string $conversion The conversion name (empty for original)
     * @return string The URL
     */
    public function getUrl(
        MediaReference $reference,
        string $conversion = ''
    ): string;

    /**
     * Get all conversion URLs for a media item.
     *
     * @param MediaReference $reference The media reference
     * @return array<string, string> Map of conversion name to URL
     */
    public function getConversionUrls(MediaReference $reference): array;

    /**
     * Get responsive image URLs for a media item.
     *
     * @param MediaReference $reference The media reference
     * @return array{srcset: string, sizes: string, src: string}
     */
    public function getResponsiveUrls(MediaReference $reference): array;

    /**
     * Build the standard media response array for API responses.
     *
     * @param HasMedia $model The model
     * @param string $collection The collection name
     * @return array{id: int, original: string, conversions: array<string, string>, srcset: string}|null
     */
    public function buildMediaResponse(HasMedia $model, string $collection): ?array;
}
```

### 2.5 Create MediaUploadException

**File:** `app/Domain/Shared/Exceptions/MediaUploadException.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Shared\Exceptions;

use Exception;

final class MediaUploadException extends Exception
{
    public static function uploadFailed(string $reason): self
    {
        return new self("Failed to upload media: {$reason}");
    }

    public static function invalidFileType(string $mimeType): self
    {
        return new self("Invalid file type: {$mimeType}");
    }

    public static function fileTooLarge(int $size, int $maxSize): self
    {
        $sizeInMb = round($size / 1024 / 1024, 2);
        $maxSizeInMb = round($maxSize / 1024 / 1024, 2);
        return new self("File size {$sizeInMb}MB exceeds maximum {$maxSizeInMb}MB");
    }

    public static function conversionFailed(string $conversion, string $reason): self
    {
        return new self("Failed to generate {$conversion} conversion: {$reason}");
    }

    public static function mediaNotFound(int $id): self
    {
        return new self("Media with ID {$id} not found");
    }
}
```

### 2.6 Create SpatieMediaService Implementation

**File:** `app/Infrastructure/Media/SpatieMediaService.php`

```php
<?php

declare(strict_types=1);

namespace App\Infrastructure\Media;

use App\Application\Shared\Services\MediaServiceInterface;
use App\Domain\Shared\Exceptions\MediaUploadException;
use App\Domain\Shared\ValueObjects\MediaReference;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\MediaCollections\Exceptions\FileCannotBeAdded;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

final class SpatieMediaService implements MediaServiceInterface
{
    public function upload(
        UploadedFile $file,
        HasMedia $model,
        string $collection = 'default'
    ): MediaReference {
        try {
            $media = $model
                ->addMedia($file)
                ->toMediaCollection($collection);

            return new MediaReference(
                id: $media->id,
                collection: $collection,
                conversions: $this->extractConversionUrls($media),
            );
        } catch (FileCannotBeAdded $e) {
            Log::error('Media upload failed', [
                'error' => $e->getMessage(),
                'model' => get_class($model),
                'model_id' => $model->getKey(),
                'collection' => $collection,
            ]);
            throw MediaUploadException::uploadFailed($e->getMessage());
        }
    }

    public function delete(MediaReference $reference): bool
    {
        try {
            $media = Media::find($reference->id);
            if ($media) {
                $media->delete();
                return true;
            }
            return false;
        } catch (\Exception $e) {
            Log::warning('Failed to delete media', [
                'media_id' => $reference->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    public function deleteCollection(HasMedia $model, string $collection): bool
    {
        try {
            $model->clearMediaCollection($collection);
            return true;
        } catch (\Exception $e) {
            Log::warning('Failed to clear media collection', [
                'model' => get_class($model),
                'model_id' => $model->getKey(),
                'collection' => $collection,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    public function getUrl(
        MediaReference $reference,
        string $conversion = ''
    ): string {
        $media = Media::findOrFail($reference->id);

        return $conversion
            ? $media->getUrl($conversion)
            : $media->getUrl();
    }

    public function getConversionUrls(MediaReference $reference): array
    {
        $media = Media::findOrFail($reference->id);
        return $this->extractConversionUrls($media);
    }

    public function getResponsiveUrls(MediaReference $reference): array
    {
        $media = Media::findOrFail($reference->id);

        return [
            'srcset' => $media->getSrcset(),
            'sizes' => '(max-width: 320px) 320px, (max-width: 640px) 640px, 1280px',
            'src' => $media->getUrl('medium'),
        ];
    }

    public function buildMediaResponse(HasMedia $model, string $collection): ?array
    {
        $media = $model->getFirstMedia($collection);

        if (!$media) {
            return null;
        }

        return [
            'id' => $media->id,
            'original' => $media->getUrl(),
            'conversions' => $this->extractConversionUrls($media),
            'srcset' => $media->getSrcset(),
        ];
    }

    /**
     * Extract all available conversion URLs from a media item.
     *
     * @return array<string, string>
     */
    private function extractConversionUrls(Media $media): array
    {
        $conversions = [];

        // Get registered conversions for this media's model
        $registeredConversions = ['thumb', 'small', 'medium', 'large', 'og'];

        foreach ($registeredConversions as $conversion) {
            if ($media->hasGeneratedConversion($conversion)) {
                $conversions[$conversion] = $media->getUrl($conversion);
            }
        }

        return $conversions;
    }
}
```

### 2.7 Create HasMediaCollections Trait

**File:** `app/Infrastructure/Persistence/Eloquent/Traits/HasMediaCollections.php`

```php
<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Traits;

use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

trait HasMediaCollections
{
    use InteractsWithMedia;

    /**
     * Boot the trait - handles cascade deletion of media.
     */
    public static function bootHasMediaCollections(): void
    {
        static::deleting(function ($model) {
            // Clear all media when entity is deleted (prevents orphans)
            // This works for both soft and hard deletes
            if (!method_exists($model, 'isForceDeleting') || $model->isForceDeleting()) {
                $model->clearMediaCollection();
            }
        });
    }

    /**
     * Register default media conversions applicable to all collections.
     *
     * Models can override this to add collection-specific conversions.
     */
    public function registerMediaConversions(Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->fit(Fit::Crop, 150, 150)
            ->sharpen(10)
            ->format('webp')
            ->nonQueued(); // Thumbs generated immediately for quick preview

        $this->addMediaConversion('small')
            ->width(320)
            ->format('webp');

        $this->addMediaConversion('medium')
            ->width(640)
            ->format('webp');

        $this->addMediaConversion('large')
            ->width(1280)
            ->format('webp');

        $this->addMediaConversion('og')
            ->fit(Fit::Crop, 1200, 630)
            ->format('webp');
    }
}
```

### 2.8 Register Service Binding

**File:** `app/Providers/AppServiceProvider.php` (modify)

```php
use App\Application\Shared\Services\MediaServiceInterface;
use App\Infrastructure\Media\SpatieMediaService;

public function register(): void
{
    // ... existing bindings

    // Media Service
    $this->app->singleton(
        MediaServiceInterface::class,
        SpatieMediaService::class
    );
}
```

### 2.9 Create Feature Flag Configuration

**File:** `config/features.php` (new)

```php
<?php

return [
    /*
     * Media System Feature Flag
     *
     * When true, uses the new Spatie Media Library system.
     * When false, falls back to legacy direct Storage usage.
     *
     * Use this for safe rollback during migration.
     */
    'use_new_media_system' => env('FEATURE_NEW_MEDIA', true),
];
```

---

## 3. Phase 2: League Integration (Pilot)

### 3.1 Update League Eloquent Model

**File:** `app/Infrastructure/Persistence/Eloquent/Models/League.php` (modify)

```php
<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Traits\HasMediaCollections;
use Spatie\MediaLibrary\HasMedia;
// ... existing imports

class League extends Model implements HasMedia
{
    use HasMediaCollections;

    // ... existing code

    /**
     * Define the media collections for this model.
     */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('logo')
            ->singleFile()  // Only one logo at a time
            ->acceptsMimeTypes(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

        $this->addMediaCollection('header')
            ->singleFile()
            ->acceptsMimeTypes(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

        $this->addMediaCollection('banner')
            ->singleFile()
            ->acceptsMimeTypes(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
    }
}
```

### 3.2 Update LeagueApplicationService

**File:** `app/Application/League/Services/LeagueApplicationService.php` (modify)

The key changes are:
1. Inject `MediaServiceInterface`
2. Replace direct `Storage::put()` calls with `$this->mediaService->upload()`
3. Use `$this->mediaService->buildMediaResponse()` for DTOs
4. Handle both old and new systems during transition (feature flag)

```php
<?php

namespace App\Application\League\Services;

use App\Application\Shared\Services\MediaServiceInterface;
// ... existing imports

class LeagueApplicationService
{
    public function __construct(
        private LeagueRepositoryInterface $leagueRepository,
        private MediaServiceInterface $mediaService,
        // ... other dependencies
    ) {}

    public function createLeague(CreateLeagueData $data): LeagueData
    {
        return DB::transaction(function () use ($data) {
            // Create the league entity first
            $league = new League(/* ... */);
            $eloquentLeague = $this->leagueRepository->save($league);

            // Upload media using new system
            if ($data->logo) {
                $this->mediaService->upload($data->logo, $eloquentLeague, 'logo');
            }

            if ($data->headerImage) {
                $this->mediaService->upload($data->headerImage, $eloquentLeague, 'header');
            }

            if ($data->banner) {
                $this->mediaService->upload($data->banner, $eloquentLeague, 'banner');
            }

            // Refresh to get media relationships
            $eloquentLeague->refresh();

            return LeagueData::fromEloquent($eloquentLeague, $this->mediaService);
        });
    }

    public function updateLeague(int $id, UpdateLeagueData $data): LeagueData
    {
        return DB::transaction(function () use ($id, $data) {
            $eloquentLeague = $this->leagueRepository->findById($id);

            // Handle logo update
            if ($data->logo) {
                // Clear existing and upload new
                $this->mediaService->deleteCollection($eloquentLeague, 'logo');
                $this->mediaService->upload($data->logo, $eloquentLeague, 'logo');
            } elseif ($data->removeLogo) {
                $this->mediaService->deleteCollection($eloquentLeague, 'logo');
            }

            // Similar for header and banner...

            $eloquentLeague->refresh();

            return LeagueData::fromEloquent($eloquentLeague, $this->mediaService);
        });
    }
}
```

### 3.3 Update LeagueData DTO

**File:** `app/Application/League/DTOs/LeagueData.php` (modify)

```php
<?php

namespace App\Application\League\DTOs;

use App\Application\Shared\Services\MediaServiceInterface;
use App\Infrastructure\Persistence\Eloquent\Models\League;

class LeagueData extends Data
{
    public function __construct(
        public int $id,
        public string $name,
        public string $slug,
        // ... other fields
        public ?array $logo,
        public ?array $headerImage,
        public ?array $banner,
        // Legacy fields for backward compatibility
        public ?string $logoUrl,
        public ?string $headerImageUrl,
        public ?string $bannerUrl,
    ) {}

    public static function fromEloquent(League $league, MediaServiceInterface $mediaService): self
    {
        return new self(
            id: $league->id,
            name: $league->name,
            slug: $league->slug,
            // ... other fields
            logo: $mediaService->buildMediaResponse($league, 'logo'),
            headerImage: $mediaService->buildMediaResponse($league, 'header'),
            banner: $mediaService->buildMediaResponse($league, 'banner'),
            // Legacy fields for backward compatibility during transition
            logoUrl: $league->logo_path
                ? Storage::disk('public')->url($league->logo_path)
                : $mediaService->buildMediaResponse($league, 'logo')['original'] ?? null,
            headerImageUrl: $league->header_image_path
                ? Storage::disk('public')->url($league->header_image_path)
                : $mediaService->buildMediaResponse($league, 'header')['original'] ?? null,
            bannerUrl: $league->banner_path
                ? Storage::disk('public')->url($league->banner_path)
                : $mediaService->buildMediaResponse($league, 'banner')['original'] ?? null,
        );
    }
}
```

---

## 4. Phase 3: Remaining Entities

### 4.1 Batch A: Competition & Season

Apply the same pattern as League:

1. Add `HasMediaCollections` trait to `Competition.php`
2. Add `HasMediaCollections` trait to `SeasonEloquent.php`
3. Define collections in `registerMediaCollections()`
4. Update `CompetitionApplicationService` to use `MediaServiceInterface`
5. Update `SeasonApplicationService` to use `MediaServiceInterface`
6. Update DTOs with `buildMediaResponse()`

**Competition Collections:**
- `logo` (single file)

**Season Collections:**
- `logo` (single file)
- `banner` (single file)

### 4.2 Batch B: Team, Division, SiteConfig

**Team:**
- Note: Currently stores `logo_url` (full URL) instead of path
- Needs migration to use media system
- Collection: `logo`

**Division:**
- Collection: `logo`

**SiteConfig:**
- Replace `SiteConfigFileModel` approach with direct media collections
- Collections: `logo`, `favicon`, `og_image`
- Consider: May want to keep metadata model for backward compatibility

---

## 5. Phase 4: Data Migration

### 5.1 Create Migration Command

**File:** `app/Console/Commands/MigrateLegacyMedia.php`

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class MigrateLegacyMedia extends Command
{
    protected $signature = 'media:migrate-legacy
                            {entity : Entity to migrate (league, competition, season, team, division, site-config)}
                            {--batch=100 : Records per batch}
                            {--dry-run : Preview without changes}';

    protected $description = 'Migrate legacy file paths to Spatie Media Library';

    public function handle(): int
    {
        $entity = $this->argument('entity');
        $batchSize = (int) $this->option('batch');
        $dryRun = $this->option('dry-run');

        $this->info("Migrating {$entity} media" . ($dryRun ? ' (dry run)' : ''));

        return match($entity) {
            'league' => $this->migrateLeagues($batchSize, $dryRun),
            'competition' => $this->migrateCompetitions($batchSize, $dryRun),
            'season' => $this->migrateSeasons($batchSize, $dryRun),
            'team' => $this->migrateTeams($batchSize, $dryRun),
            'division' => $this->migrateDivisions($batchSize, $dryRun),
            'site-config' => $this->migrateSiteConfig($batchSize, $dryRun),
            default => $this->error("Unknown entity: {$entity}") ?? 1,
        };
    }

    private function migrateLeagues(int $batchSize, bool $dryRun): int
    {
        $query = League::whereNotNull('logo_path')
            ->orWhereNotNull('header_image_path')
            ->orWhereNotNull('banner_path');

        $total = $query->count();
        $migrated = 0;
        $failed = 0;

        $this->info("Found {$total} leagues with legacy media");

        $query->chunk($batchSize, function ($leagues) use ($dryRun, &$migrated, &$failed) {
            foreach ($leagues as $league) {
                try {
                    if (!$dryRun) {
                        $this->migrateLeagueMedia($league);
                    }
                    $migrated++;
                    $this->line("  ✓ League #{$league->id}: {$league->name}");
                } catch (\Exception $e) {
                    $failed++;
                    $this->error("  ✗ League #{$league->id}: {$e->getMessage()}");
                }
            }
        });

        $this->info("Completed: {$migrated} migrated, {$failed} failed");

        return $failed > 0 ? 1 : 0;
    }

    private function migrateLeagueMedia(League $league): void
    {
        $disk = Storage::disk('public');

        // Migrate logo
        if ($league->logo_path && $disk->exists($league->logo_path)) {
            $league->addMediaFromDisk($league->logo_path, 'public')
                ->preservingOriginal()
                ->toMediaCollection('logo');
        }

        // Migrate header image
        if ($league->header_image_path && $disk->exists($league->header_image_path)) {
            $league->addMediaFromDisk($league->header_image_path, 'public')
                ->preservingOriginal()
                ->toMediaCollection('header');
        }

        // Migrate banner
        if ($league->banner_path && $disk->exists($league->banner_path)) {
            $league->addMediaFromDisk($league->banner_path, 'public')
                ->preservingOriginal()
                ->toMediaCollection('banner');
        }
    }

    // Similar methods for other entities...
}
```

### 5.2 Migration Workflow

1. Run migration in staging with `--dry-run` first
2. Review output for any issues
3. Run actual migration on staging
4. Validate all images accessible
5. Run migration in production during low-traffic period
6. Keep legacy paths for 7-day validation period
7. Create cleanup migration to remove legacy path columns

---

## 6. API Response Contracts

### 6.1 Media Object Structure

All endpoints returning media should use this consistent structure:

```json
{
  "logo": {
    "id": 123,
    "original": "https://domain.com/storage/media/1/logo.png",
    "conversions": {
      "thumb": "https://domain.com/storage/media/1/conversions/logo-thumb.webp",
      "small": "https://domain.com/storage/media/1/conversions/logo-small.webp",
      "medium": "https://domain.com/storage/media/1/conversions/logo-medium.webp",
      "large": "https://domain.com/storage/media/1/conversions/logo-large.webp"
    },
    "srcset": "https://.../thumb.webp 150w, https://.../small.webp 320w, https://.../medium.webp 640w, https://.../large.webp 1280w"
  }
}
```

### 6.2 Backward Compatibility

During transition, also include legacy fields:

```json
{
  "logo": { /* new structure */ },
  "logo_url": "https://domain.com/storage/leagues/logos/old-logo.png"
}
```

---

## 7. Testing Requirements

### 7.1 Unit Tests

**MediaReference Value Object:**
```php
// tests/Unit/Domain/Shared/ValueObjects/MediaReferenceTest.php

class MediaReferenceTest extends TestCase
{
    public function test_creates_from_constructor(): void
    {
        $ref = new MediaReference(1, 'logos', ['thumb' => 'url']);

        $this->assertEquals(1, $ref->id);
        $this->assertEquals('logos', $ref->collection);
        $this->assertEquals(['thumb' => 'url'], $ref->conversions);
    }

    public function test_creates_from_array(): void
    {
        $data = ['id' => 1, 'collection' => 'logos', 'conversions' => []];
        $ref = MediaReference::fromArray($data);

        $this->assertEquals(1, $ref->id);
    }

    public function test_converts_to_array(): void
    {
        $ref = new MediaReference(1, 'logos', ['thumb' => 'url']);

        $this->assertEquals([
            'id' => 1,
            'collection' => 'logos',
            'conversions' => ['thumb' => 'url'],
        ], $ref->toArray());
    }

    public function test_equality(): void
    {
        $ref1 = new MediaReference(1, 'logos');
        $ref2 = new MediaReference(1, 'logos');
        $ref3 = new MediaReference(2, 'logos');

        $this->assertTrue($ref1->equals($ref2));
        $this->assertFalse($ref1->equals($ref3));
    }
}
```

### 7.2 Integration Tests

**SpatieMediaService:**
```php
// tests/Integration/Infrastructure/Media/SpatieMediaServiceTest.php

class SpatieMediaServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_uploads_file_and_returns_reference(): void
    {
        $service = app(MediaServiceInterface::class);
        $file = UploadedFile::fake()->image('logo.png', 1000, 1000);
        $league = League::factory()->create();

        $reference = $service->upload($file, $league, 'logo');

        $this->assertNotNull($reference->id);
        $this->assertEquals('logo', $reference->collection);
        $this->assertDatabaseHas('media', [
            'id' => $reference->id,
            'model_type' => League::class,
            'model_id' => $league->id,
            'collection_name' => 'logo',
        ]);
    }

    public function test_generates_conversions(): void
    {
        $service = app(MediaServiceInterface::class);
        $file = UploadedFile::fake()->image('logo.png', 1000, 1000);
        $league = League::factory()->create();

        $reference = $service->upload($file, $league, 'logo');

        // Wait for queue to process (or run synchronously in tests)
        $this->assertArrayHasKey('thumb', $reference->conversions);
        $this->assertArrayHasKey('medium', $reference->conversions);
    }

    public function test_deletes_media(): void
    {
        $service = app(MediaServiceInterface::class);
        $file = UploadedFile::fake()->image('logo.png');
        $league = League::factory()->create();

        $reference = $service->upload($file, $league, 'logo');
        $mediaId = $reference->id;

        $result = $service->delete($reference);

        $this->assertTrue($result);
        $this->assertDatabaseMissing('media', ['id' => $mediaId]);
    }

    public function test_deletes_media_when_entity_deleted(): void
    {
        $service = app(MediaServiceInterface::class);
        $file = UploadedFile::fake()->image('logo.png');
        $league = League::factory()->create();

        $reference = $service->upload($file, $league, 'logo');
        $mediaId = $reference->id;

        $league->forceDelete();

        $this->assertDatabaseMissing('media', ['id' => $mediaId]);
    }

    public function test_builds_media_response(): void
    {
        $service = app(MediaServiceInterface::class);
        $file = UploadedFile::fake()->image('logo.png', 1000, 1000);
        $league = League::factory()->create();

        $service->upload($file, $league, 'logo');
        $league->refresh();

        $response = $service->buildMediaResponse($league, 'logo');

        $this->assertArrayHasKey('id', $response);
        $this->assertArrayHasKey('original', $response);
        $this->assertArrayHasKey('conversions', $response);
        $this->assertArrayHasKey('srcset', $response);
    }
}
```

### 7.3 Feature Tests

```php
// tests/Feature/Http/Controllers/User/LeagueControllerTest.php

public function test_create_league_with_logo_returns_media_response(): void
{
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->postJson('/api/leagues', [
            'name' => 'Test League',
            'logo' => UploadedFile::fake()->image('logo.png', 500, 500),
        ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'data' => [
                'id',
                'name',
                'logo' => [
                    'id',
                    'original',
                    'conversions' => ['thumb', 'medium', 'large'],
                    'srcset',
                ],
            ],
        ]);
}
```

---

## 8. File Reference

### 8.1 New Files to Create

```
app/
├── Domain/
│   └── Shared/
│       ├── ValueObjects/
│       │   └── MediaReference.php
│       └── Exceptions/
│           └── MediaUploadException.php
├── Application/
│   └── Shared/
│       └── Services/
│           └── MediaServiceInterface.php
├── Infrastructure/
│   ├── Media/
│   │   └── SpatieMediaService.php
│   └── Persistence/
│       └── Eloquent/
│           └── Traits/
│               └── HasMediaCollections.php
└── Console/
    └── Commands/
        └── MigrateLegacyMedia.php

config/
├── media-library.php (published from package)
└── features.php

database/migrations/
└── xxxx_create_media_table.php (published from package)

tests/
├── Unit/
│   └── Domain/
│       └── Shared/
│           └── ValueObjects/
│               └── MediaReferenceTest.php
└── Integration/
    └── Infrastructure/
        └── Media/
            └── SpatieMediaServiceTest.php
```

### 8.2 Files to Modify

```
app/
├── Infrastructure/
│   └── Persistence/
│       └── Eloquent/
│           └── Models/
│               ├── League.php (add HasMedia, collections)
│               ├── SeasonEloquent.php (add HasMedia, collections)
│               ├── Competition.php (add HasMedia, collections)
│               ├── Team.php (add HasMedia, collections)
│               ├── Division.php (add HasMedia, collections)
│               └── SiteConfigModel.php (add HasMedia, collections)
├── Application/
│   ├── League/
│   │   ├── Services/LeagueApplicationService.php
│   │   └── DTOs/LeagueData.php, CreateLeagueData.php, etc.
│   ├── Competition/
│   │   ├── Services/CompetitionApplicationService.php
│   │   ├── Services/SeasonApplicationService.php
│   │   └── DTOs/*.php
│   └── Team/
│       ├── Services/TeamApplicationService.php
│       └── DTOs/*.php
└── Providers/
    └── AppServiceProvider.php (add MediaServiceInterface binding)
```

---

## Related Documents

- [01-media-management-architecture-plan.md](./01-media-management-architecture-plan.md) - Full architecture specification
- [02-media-implementation-overview.md](./02-media-implementation-overview.md) - Implementation overview
- [04-media-frontend-implementation.md](./04-media-frontend-implementation.md) - Frontend implementation details

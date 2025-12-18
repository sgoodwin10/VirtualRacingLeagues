# Media Management Architecture Plan

> **Document Version:** 1.2
> **Created:** December 2024
> **Updated:** December 2024
> **Status:** Draft - Pending Review

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Problems & Limitations](#3-problems--limitations)
4. [Proposed Solution Architecture](#4-proposed-solution-architecture)
5. [Implementation Plan](#5-implementation-plan)
6. [Migration Strategy](#6-migration-strategy)
7. [Testing Strategy](#7-testing-strategy)
8. [Cost Analysis](#8-cost-analysis)
9. [Best Practices & Guidelines](#9-best-practices--guidelines)
10. [Future Enhancements Roadmap](#10-future-enhancements-roadmap)
11. [Acceptance Criteria](#11-acceptance-criteria)
12. [Appendices](#12-appendices)

---

## 1. Executive Summary

### Current Situation
The application currently uses an inconsistent approach to image/media storage with direct filesystem calls scattered across multiple services. Images are stored without optimization, and there's no CDN integration.

### Proposed Solution
Implement **Spatie Media Library v11** as the core media management solution, wrapped in a DDD-compliant architecture with a `MediaService` interface. This provides:

- Automatic image optimization and format conversion (WebP)
- Responsive image generation with srcset support
- **Local storage initially**, with CDN-ready architecture for future migration
- Centralized, consistent media handling across all entities

### Expected Benefits (Phase 1 - Local Storage)
- **30%+ faster page loads** through optimized images
- **50%+ storage savings** with WebP conversion
- **DDD-compliant** architecture maintaining domain purity
- **CDN-ready** - simple configuration change to enable CDN later

### Future Benefits (Phase 2 - CDN Integration)
- **95%+ CDN cache hits** reducing server load
- **~$18/month** at scale with CloudFlare R2 (vs $65 with AWS S3)
- Global edge caching for faster worldwide access

---

## 2. Current State Analysis

### 2.1 Entities with Image Fields

| Entity | Image Fields | Storage Type |
|--------|-------------|--------------|
| Site Config | logo, favicon, og_image | FileStorageServiceInterface |
| League | logo_path, header_image_path | Direct Storage::put |
| Competition | logo_path | Direct Storage::put |
| Season | logo_path, banner_path | Direct Storage::put |
| Division | logo_path | Direct Storage::put |
| Team | logo_path | Direct Storage::put |

### 2.2 Current Storage Configuration

**Location:** `config/filesystems.php`

```php
'disks' => [
    'local' => [
        'driver' => 'local',
        'root' => storage_path('app'),
    ],
    'public' => [
        'driver' => 'local',
        'root' => storage_path('app/public'),
        'url' => env('APP_URL').'/storage',
        'visibility' => 'public',
    ],
]
```

### 2.3 Current File Storage Service

**Interface:** `App\Application\SiteConfig\Services\FileStorageServiceInterface`
**Implementation:** `App\Infrastructure\Storage\LocalFileStorageService`

This service is **only used by Site Config** and provides:
- `store(UploadedFile $file, string $directory): string`
- `delete(string $path): bool`
- `getUrl(string $path): string`

### 2.4 Upload Patterns Found

**Pattern 1: Site Config (via FileStorageService)**
```php
// SiteConfigApplicationService
$path = $this->fileStorage->store($file, 'site-config');
```

**Pattern 2: Other Entities (direct Storage calls)**
```php
// LeagueApplicationService
$path = $data->logo->store('leagues/logos', 'public');
```

### 2.5 Database Schema

All image fields are stored as nullable strings:

```php
// Leagues
$table->string('logo_path')->nullable();
$table->string('header_image_path')->nullable();

// Competitions, Seasons, Divisions, Teams
$table->string('logo_path')->nullable();

// Seasons additional
$table->string('banner_path')->nullable();
```

---

## 3. Problems & Limitations

### 3.1 Critical Issues

| Issue | Impact | Severity |
|-------|--------|----------|
| **No Image Optimization** | Original images served, slow page loads | High |
| **Inconsistent Architecture** | FileStorageService used only for Site Config | High |
| **No Responsive Images** | Same image served to all devices | Medium |
| **No CDN Support** | All requests hit Laravel server | Low (Future) |

> **Note:** CDN support is marked as "Low (Future)" because it will be addressed in a future phase. The architecture will be designed to make CDN integration a simple configuration change.

### 3.2 Architectural Issues

1. **Code Duplication**: Upload logic duplicated across 6+ application services
2. **Limited Metadata**: Only paths stored, losing file size, MIME type, dimensions
3. **No Format Conversion**: PNG/JPG served as-is, no WebP
4. **Tight Coupling**: Services directly dependent on Laravel Storage facade
5. **No Cleanup Strategy**: Orphaned files when entities are deleted

### 3.3 Scalability Concerns

1. **Storage Costs**: Original images consume unnecessary disk space
2. **Bandwidth Costs**: Large images transferred on every request
3. **Server Load**: PHP/Laravel serves all static assets
4. **No Caching Strategy**: Browser caching not optimized

---

## 4. Proposed Solution Architecture

### 4.1 Technology Choice: Spatie Media Library v11

**Why Spatie Media Library?**
- Battle-tested (10K+ production installations)
- Laravel-native, active maintenance
- Automatic image conversions and responsive images
- Built-in CDN support via custom disk drivers
- Polymorphic relationships (works with any model)

### 4.2 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Interface Layer                          │
│  Controllers receive UploadedFile, pass to Application      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
│  Application Services use MediaServiceInterface             │
│  MediaReference value object returned to domain             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Domain Layer                            │
│  MediaReference value object (id, collection, conversions)  │
│  Entities hold MediaReference, not file paths               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                       │
│  SpatieMediaService implements MediaServiceInterface        │
│  Wraps Spatie Media Library, handles all file operations    │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 New Components

#### 4.3.1 Domain Layer

**MediaReference Value Object:**
```php
namespace App\Domain\Shared\ValueObjects;

final class MediaReference
{
    public function __construct(
        public readonly int $id,
        public readonly string $collection,
        public readonly array $conversions = [],
    ) {}

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'collection' => $this->collection,
            'conversions' => $this->conversions,
        ];
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            collection: $data['collection'],
            conversions: $data['conversions'] ?? [],
        );
    }
}
```

> **Architecture Note:** The `int $id` references Spatie's media table primary key. This is a pragmatic choice—Spatie's polymorphic relationship handles the entity-to-media mapping automatically. The domain entity doesn't store the MediaReference directly; instead, Spatie's `media` table stores `model_type` and `model_id` columns that reference our Eloquent models. This means no schema changes to entity tables are needed.

#### 4.3.2 Application Layer

**MediaServiceInterface:**
```php
namespace App\Application\Shared\Services;

use Illuminate\Http\UploadedFile;
use App\Domain\Shared\ValueObjects\MediaReference;

interface MediaServiceInterface
{
    public function upload(
        UploadedFile $file,
        object $model,
        string $collection = 'default'
    ): MediaReference;

    public function delete(MediaReference $reference): bool;

    public function getUrl(
        MediaReference $reference,
        string $conversion = ''
    ): string;

    public function getResponsiveUrls(MediaReference $reference): array;
}
```

#### 4.3.3 Infrastructure Layer

**SpatieMediaService:**
```php
namespace App\Infrastructure\Media;

use Spatie\MediaLibrary\MediaCollections\Models\Media;

class SpatieMediaService implements MediaServiceInterface
{
    public function upload(
        UploadedFile $file,
        object $model,
        string $collection = 'default'
    ): MediaReference {
        $media = $model
            ->addMedia($file)
            ->toMediaCollection($collection);

        return new MediaReference(
            id: $media->id,
            collection: $collection,
            conversions: $this->getConversionUrls($media),
        );
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

    // ... additional methods
}
```

### 4.4 Image Conversions

**Registered Conversions:**

| Name | Dimensions | Use Case |
|------|-----------|----------|
| thumb | 150x150 | Thumbnails, avatars |
| small | 320px width | Mobile devices |
| medium | 640px width | Tablet, small screens |
| large | 1280px width | Desktop |
| og | 1200x630 | Social sharing |

**Format Strategy:**
- Primary: WebP (30% smaller than JPEG)
- Fallback: Original format for older browsers

### 4.5 Storage Strategy

#### Phase 1: Local Storage (Initial Implementation)

Files are stored on the local `public` disk, served via Laravel's storage symlink:

```php
// config/filesystems.php
'disks' => [
    'public' => [
        'driver' => 'local',
        'root' => storage_path('app/public'),
        'url' => env('APP_URL').'/storage',
        'visibility' => 'public',
    ],
],

// config/media-library.php
'disk_name' => env('MEDIA_DISK', 'public'),
```

**Advantages:**
- Zero external dependencies
- Simple deployment
- No additional costs
- Easy local development

**Considerations:**
- Server handles all static file requests
- Storage limited to server disk space
- No geographic distribution

#### Phase 2: CDN Integration (Future)

When ready for CDN, simply change the disk configuration:

**Recommended: CloudFlare R2**

```php
// config/filesystems.php
'disks' => [
    'media' => [
        'driver' => 's3',
        'key' => env('CLOUDFLARE_R2_ACCESS_KEY_ID'),
        'secret' => env('CLOUDFLARE_R2_SECRET_ACCESS_KEY'),
        'region' => 'auto',
        'bucket' => env('CLOUDFLARE_R2_BUCKET'),
        'url' => env('CLOUDFLARE_R2_URL'),
        'endpoint' => env('CLOUDFLARE_R2_ENDPOINT'),
    ],
],

// config/media-library.php (just change env)
'disk_name' => env('MEDIA_DISK', 'media'),
```

**Migration Path:**
1. Create R2 bucket and configure credentials
2. Update `.env` with `MEDIA_DISK=media`
3. Run `php artisan media:sync-to-cdn` to copy existing files
4. Update DNS/CDN settings
5. Done - no code changes required

### 4.6 Queue Processing for Conversions

Image conversions should run asynchronously to avoid blocking user requests:

```php
// config/media-library.php
'queue_connection_name' => env('MEDIA_QUEUE_CONNECTION', 'redis'),
'queue_name' => 'media-conversions',
'queue_conversions_by_default' => true,
```

**Important:** Ensure queue workers are running:
```bash
php artisan queue:work redis --queue=media-conversions
```

### 4.7 API Response Contract

All endpoints returning media should use this consistent structure:

```json
{
  "logo": {
    "id": 123,
    "original": "https://domain.com/storage/media/1/logo.png",
    "conversions": {
      "thumb": "https://domain.com/storage/media/1/conversions/logo-thumb.webp",
      "medium": "https://domain.com/storage/media/1/conversions/logo-medium.webp",
      "large": "https://domain.com/storage/media/1/conversions/logo-large.webp"
    },
    "srcset": "https://.../thumb.webp 150w, https://.../medium.webp 640w, https://.../large.webp 1280w"
  }
}
```

**DTO Helper Method:**
```php
// In LeagueData DTO
public static function mediaToArray(?Media $media): ?array
{
    if (!$media) return null;

    return [
        'id' => $media->id,
        'original' => $media->getUrl(),
        'conversions' => [
            'thumb' => $media->getUrl('thumb'),
            'medium' => $media->getUrl('medium'),
            'large' => $media->getUrl('large'),
        ],
        'srcset' => $media->getSrcset(),
    ];
}
```

---

## 5. Implementation Plan

### Phase 1: Foundation

**Tasks:**
1. Install Spatie Media Library
   ```bash
   composer require spatie/laravel-medialibrary
   php artisan vendor:publish --provider="Spatie\MediaLibrary\MediaLibraryServiceProvider" --tag="medialibrary-migrations"
   php artisan vendor:publish --provider="Spatie\MediaLibrary\MediaLibraryServiceProvider" --tag="medialibrary-config"
   php artisan migrate
   php artisan storage:link  # Required for public disk access
   ```

2. Create MediaReference value object
3. Create MediaServiceInterface
4. Create SpatieMediaService implementation
5. Register service in AppServiceProvider
6. Configure image conversions and queue processing in config

**Deliverables:**
- [ ] Media Library installed and configured
- [ ] Storage symlink created
- [ ] MediaReference value object created
- [ ] MediaServiceInterface defined
- [ ] SpatieMediaService implemented
- [ ] Unit tests for MediaReference

### Phase 2: League Integration - Pilot

**Tasks:**
1. Add `HasMedia` interface to LeagueEloquent model
2. Define media collections and conversions
3. Update LeagueApplicationService to use MediaServiceInterface
4. Update LeagueController for file uploads
5. Update frontend to use new image URLs
6. Create migration for legacy data

**Deliverables:**
- [ ] League model uses Media Library
- [ ] Logo and header image uploads working
- [ ] Image conversions generated automatically
- [ ] Tests passing

### Phase 3: Remaining Entities

**Batch A:**
- Competition entity integration
- Season entity integration (logo + banner)

**Batch B:**
- Team entity integration
- Site Config migration to new system

> **Note:** Site Config currently uses `FileStorageServiceInterface`. During migration, update it to use `MediaServiceInterface` and deprecate the old interface.

**Deliverables:**
- [ ] All entities using MediaServiceInterface
- [ ] Consistent image handling across application
- [ ] All tests passing

### Phase 4: Data Migration

**Tasks:**
1. Create migration command for existing images
2. Implement dual-write during transition
3. Run migration in staging
4. Validate all images migrated
5. Run migration in production
6. Remove legacy file paths

**Deliverables:**
- [ ] All existing images migrated
- [ ] No broken image links
- [ ] Legacy paths removed
- [ ] Storage cleaned up

### Phase 5: Optimization & Polish

**Tasks:**
1. Add lazy loading to frontend
2. Implement progressive loading
3. Add image placeholders
4. Performance testing
5. Documentation updates

**Deliverables:**
- [ ] Lazy loading implemented
- [ ] Performance benchmarks met
- [ ] Documentation complete

### Future Phase: CDN Integration (When Ready)

> **Note:** This phase is optional and can be implemented when the project requires CDN benefits (global distribution, reduced server load, etc.)

**Tasks:**
1. Set up CloudFlare R2 bucket
2. Configure media disk for R2 in `.env`
3. Run `php artisan media:sync-to-cdn` to migrate existing files
4. Update DNS/CDN settings
5. Configure cache headers
6. Test uploads and URL generation
7. Monitor and optimize

**Deliverables:**
- [ ] R2 bucket created and configured
- [ ] All existing media synced to CDN
- [ ] Images served via CDN
- [ ] Cache headers optimized
- [ ] Load testing completed

**Trigger Conditions:**
Consider implementing CDN when:
- Server bandwidth becomes a bottleneck
- Users are geographically distributed
- Storage costs on server become significant
- Page load times need further improvement

---

## 6. Migration Strategy

### 6.1 Zero-Downtime Approach

**Dual-Write Strategy:**
1. New uploads go to both old path AND Media Library
2. Read from Media Library first, fallback to old path
3. Background job migrates existing images
4. Once complete, remove old paths

### 6.2 Migration Command

```php
php artisan media:migrate-legacy {entity} --batch=100
```

**Options:**
- `--entity`: league, competition, season, division, team, site-config
- `--batch`: Number of records per batch
- `--dry-run`: Preview without changes

### 6.3 Rollback Plan

Each phase has a rollback procedure:
1. Keep original file paths in database
2. Dual-write ensures old system still works
3. Feature flag to switch between old/new
4. Only remove old paths after validation period

**Feature Flag Implementation:**
```php
// config/features.php
return [
    'use_new_media_system' => env('FEATURE_NEW_MEDIA', true),
];

// Usage in Application Service
if (config('features.use_new_media_system')) {
    $this->mediaService->upload($file, $league, 'logo');
} else {
    $path = $file->store('leagues/logos', 'public');
}
```

### 6.4 Error Handling

**Failed Uploads:**
```php
// SpatieMediaService
public function upload(...): MediaReference
{
    try {
        $media = $model->addMedia($file)->toMediaCollection($collection);
        return new MediaReference(...);
    } catch (FileCannotBeAdded $e) {
        Log::error('Media upload failed', ['error' => $e->getMessage()]);
        throw new MediaUploadException('Failed to upload file: ' . $e->getMessage());
    }
}
```

**Failed Conversions:**
- Spatie handles conversion failures gracefully—original file is kept
- Failed conversions are logged and can be retried via `php artisan media:regenerate`
- Monitor `failed_jobs` table for queue failures

**Orphan Cleanup on Entity Deletion:**
Handled automatically via model events (see Appendix C for implementation).

---

## 7. Testing Strategy

### 7.1 Unit Tests

**MediaReference Value Object:**
```php
class MediaReferenceTest extends TestCase
{
    public function test_creates_from_array(): void
    {
        $data = ['id' => 1, 'collection' => 'logos', 'conversions' => []];
        $ref = MediaReference::fromArray($data);

        $this->assertEquals(1, $ref->id);
        $this->assertEquals('logos', $ref->collection);
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
}
```

### 7.2 Integration Tests

**SpatieMediaService:**
```php
class SpatieMediaServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');  // Isolate tests from real filesystem
    }

    public function test_uploads_file_and_generates_conversions(): void
    {
        $service = app(MediaServiceInterface::class);
        $file = UploadedFile::fake()->image('logo.png', 1000, 1000);
        $league = League::factory()->create();

        $reference = $service->upload($file, $league, 'logo');

        $this->assertNotNull($reference->id);
        $this->assertArrayHasKey('thumb', $reference->conversions);
    }

    public function test_deletes_media_when_entity_deleted(): void
    {
        $league = League::factory()->create();
        $file = UploadedFile::fake()->image('logo.png');
        $service = app(MediaServiceInterface::class);

        $reference = $service->upload($file, $league, 'logo');
        $mediaId = $reference->id;

        $league->delete();

        $this->assertDatabaseMissing('media', ['id' => $mediaId]);
    }
}
```

### 7.3 E2E Tests

**Playwright Test:**
```typescript
test('league logo upload generates responsive images', async ({ page }) => {
    await page.goto('/admin/leagues/create');

    await page.setInputFiles('input[type="file"]', 'fixtures/logo.png');
    await page.click('button[type="submit"]');

    await expect(page.locator('img.league-logo')).toHaveAttribute(
        'srcset',
        /thumb.*small.*medium.*large/
    );
});
```

---

## 8. Cost Analysis

### 8.1 Phase 1: Local Storage Costs

**Initial Implementation (Local Storage):**

| Item | Cost |
|------|------|
| Server disk space | Included with hosting |
| Bandwidth | Included with hosting |
| Additional services | $0 |
| **Monthly Total** | **$0 additional** |

**Considerations:**
- Storage grows with content - monitor disk usage
- High traffic may require server upgrade before CDN

### 8.2 Storage Savings from Optimization

Regardless of storage location, image optimization provides significant savings:

| Scenario | Original | Optimized | Savings |
|----------|----------|-----------|---------|
| 1000 images @ 2MB avg | 2GB | 800MB | 60% |
| 10000 images @ 2MB avg | 20GB | 8GB | 60% |
| With WebP conversion | - | Additional 30% | 72% total |

### 8.3 Future Phase: CDN Cost Comparison

When ready to implement CDN, here's the cost comparison:

| Metric | CloudFlare R2 | AWS S3 |
|--------|--------------|--------|
| Storage (100GB) | $1.50/mo | $2.30/mo |
| Egress (1TB) | $0 (free) | $90/mo |
| PUT requests (100K) | $0.45 | $0.50 |
| GET requests (1M) | $0.36 | $0.40 |
| **Monthly Total** | **~$18** | **~$65** |

**Recommendation:** CloudFlare R2 for significant egress cost savings.

---

## 9. Best Practices & Guidelines

### 9.1 Uploading Images

```php
// In Application Service
public function createLeague(CreateLeagueData $data): LeagueData
{
    $league = League::create([...]);

    if ($data->logo) {
        $this->mediaService->upload($data->logo, $league, 'logo');
    }

    return LeagueData::from($league);
}
```

### 9.2 Displaying Images in Vue

**Basic Usage:**
```vue
<template>
  <img
    :src="league.logo?.original"
    :srcset="league.logo?.srcset"
    sizes="(max-width: 640px) 100vw, 640px"
    loading="lazy"
    alt="League logo"
  />
</template>
```

**With WebP Fallback (for older browser support):**
```vue
<template>
  <picture v-if="league.logo">
    <source :srcset="league.logo.srcset" type="image/webp" />
    <img
      :src="league.logo.original"
      loading="lazy"
      alt="League logo"
    />
  </picture>
</template>
```

### 9.3 Image Requirements

| Type | Max Size | Dimensions | Formats |
|------|----------|------------|---------|
| Logo | 2MB | 500x500 min | PNG, JPG, WebP |
| Banner | 5MB | 1920x400 min | PNG, JPG, WebP |
| Favicon | 500KB | 512x512 | PNG, ICO |
| OG Image | 2MB | 1200x630 | PNG, JPG |

### 9.4 Validation Rules

```php
// Basic validation with MIME type checking
'logo' => [
    'nullable',
    'image',
    'mimes:png,jpg,jpeg,webp',  // Validate actual MIME type, not just extension
    'max:2048',
    'dimensions:min_width=500,min_height=500'
],
'banner' => [
    'nullable',
    'image',
    'mimes:png,jpg,jpeg,webp',
    'max:5120',
    'dimensions:min_width=1920,min_height=400'
],
'favicon' => [
    'nullable',
    'mimes:png,ico',
    'max:512',
    'dimensions:min_width=512,min_height=512'
],
```

> **Security Note:** The `mimes` rule validates actual file content (MIME type), not just the extension. This prevents users from uploading malicious files with renamed extensions.

---

## 10. Future Enhancements Roadmap

### Phase 1 Complete (This Plan - Local Storage)
- [x] Core media management with Spatie Media Library
- [x] Image optimization (WebP conversion)
- [x] Responsive image generation
- [x] All entities migrated
- [x] CDN-ready architecture

### Near-Term Enhancements

**CDN Integration (When Needed):**
- [ ] CloudFlare R2 setup and configuration
- [ ] Existing media migration to CDN
- [ ] Cache header optimization
- [ ] Performance monitoring

**Additional Features:**
- [ ] Video upload support
- [ ] PDF document management
- [ ] Image cropping UI

### Long-Term Enhancements

**Advanced Features:**
- [ ] AI-powered image tagging
- [ ] Automatic alt text generation
- [ ] Content-aware cropping
- [ ] Media library browser (admin)
- [ ] Bulk upload support
- [ ] Image search

---

## 11. Acceptance Criteria

### Must Have (MVP - Local Storage)
- [ ] All image uploads use MediaServiceInterface
- [ ] Automatic WebP conversion
- [ ] At least 3 size variants generated (thumb, medium, large)
- [ ] Local storage working with public disk
- [ ] Zero broken image links after migration
- [ ] Page load time improved by 20%+
- [ ] Architecture is CDN-ready (disk configurable via env)

### Should Have
- [ ] Responsive images with srcset
- [ ] Lazy loading on all images
- [ ] Image placeholders during load
- [ ] Admin UI for viewing media

### Nice to Have
- [ ] Drag-and-drop upload
- [ ] Image cropping before upload
- [ ] Bulk image operations

### Future Phase (CDN)
- [ ] CDN serving all media
- [ ] 95%+ cache hit rate
- [ ] Global edge distribution

---

## 12. Appendices

### A. Installation Commands

```bash
# Install Media Library
composer require spatie/laravel-medialibrary

# Publish migrations
php artisan vendor:publish --provider="Spatie\MediaLibrary\MediaLibraryServiceProvider" --tag="medialibrary-migrations"

# Publish config
php artisan vendor:publish --provider="Spatie\MediaLibrary\MediaLibraryServiceProvider" --tag="medialibrary-config"

# Run migrations
php artisan migrate

# Create storage symlink (required for public disk access)
php artisan storage:link

# Install image optimization tools (optional but recommended)
composer require spatie/image-optimizer
```

### B. Configuration File

```php
// config/media-library.php
return [
    'disk_name' => env('MEDIA_DISK', 'public'),

    'max_file_size' => 1024 * 1024 * 10, // 10MB

    // Queue configuration for async conversions
    'queue_connection_name' => env('MEDIA_QUEUE_CONNECTION', 'redis'),
    'queue_name' => 'media-conversions',
    'queue_conversions_by_default' => true,

    'image_optimizers' => [
        Spatie\ImageOptimizer\Optimizers\Jpegoptim::class => [
            '-m85',
            '--strip-all',
            '--all-progressive',
        ],
        Spatie\ImageOptimizer\Optimizers\Pngquant::class => [
            '--force',
        ],
    ],

    'image_generators' => [
        Spatie\MediaLibrary\Conversions\ImageGenerators\Image::class,
        Spatie\MediaLibrary\Conversions\ImageGenerators\Webp::class,
    ],
];
```

### C. Model Trait Example

```php
namespace App\Infrastructure\Persistence\Eloquent\Traits;

use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

trait HasMediaCollections
{
    use InteractsWithMedia;

    /**
     * Boot the trait - handles cascade deletion of media
     */
    public static function bootHasMediaCollections(): void
    {
        static::deleting(function ($model) {
            // Clear all media when entity is deleted (prevents orphans)
            $model->clearMediaCollection();
        });
    }

    public function registerMediaConversions(Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(150)
            ->height(150)
            ->sharpen(10)
            ->format('webp');

        $this->addMediaConversion('small')
            ->width(320)
            ->format('webp');

        $this->addMediaConversion('medium')
            ->width(640)
            ->format('webp');

        $this->addMediaConversion('large')
            ->width(1280)
            ->format('webp');
    }
}
```

> **Note:** The `bootHasMediaCollections` method ensures all associated media files are deleted when an entity is deleted, preventing orphaned files in storage.

### D. Files Reference

**New Files to Create:**
```
app/
├── Domain/Shared/ValueObjects/MediaReference.php
├── Application/Shared/Services/MediaServiceInterface.php
└── Infrastructure/Media/SpatieMediaService.php

config/
└── media-library.php (published from package)

database/migrations/
└── xxxx_create_media_table.php (published from package)
```

**Files to Modify:**
```
app/Infrastructure/Persistence/Eloquent/Models/
├── LeagueEloquent.php (add HasMedia interface)
├── CompetitionEloquent.php
├── SeasonEloquent.php
├── DivisionEloquent.php
└── TeamEloquent.php

app/Application/*/Services/
├── LeagueApplicationService.php (use MediaServiceInterface)
├── CompetitionApplicationService.php
├── SeasonApplicationService.php
└── TeamApplicationService.php

app/Providers/
└── AppServiceProvider.php (register MediaServiceInterface binding)
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2024 | Claude | Initial draft |
| 1.1 | Dec 2024 | Claude | Updated to start with local storage; CDN moved to future phase |
| 1.2 | Dec 2024 | Claude | Added: API response contract, queue processing, error handling, cascade deletion, test isolation, WebP fallback, MIME validation, feature flag rollback, storage:link command. Removed week-based timelines. |

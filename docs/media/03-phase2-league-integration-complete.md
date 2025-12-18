# Phase 2 - League Entity Media Integration

**Status:** COMPLETE
**Date Completed:** December 17, 2025
**Integration Type:** Pilot Implementation

## Summary

Successfully integrated the League entity with the Media Management system created in Phase 1. This is the pilot integration that establishes patterns for other entities (Season, Competition, Team, Division, SiteConfig).

## Changes Implemented

### 1. LeagueEloquent Model Updates
**File:** `app/Infrastructure/Persistence/Eloquent/Models/League.php`

- Implemented `HasMedia` interface from Spatie Media Library
- Added `HasMediaCollections` trait
- Defined three single-file media collections:
  - `logo` - League logo
  - `header_image` - League header image
  - `banner` - League banner
- Configured MIME type restrictions (jpeg, png, webp, jpg)

### 2. LeagueApplicationService Updates
**File:** `app/Application/League/Services/LeagueApplicationService.php`

- Injected `MediaServiceInterface` via constructor
- Updated `createLeague()` method:
  - Dual-write strategy: uploads to both old Storage system (for backward compatibility) and new Media Library
  - Uses `MediaServiceInterface->upload()` for new media management
  - Cleans up on failure
  
- Updated `updateLeague()` method:
  - Replaces old media with new using `MediaServiceInterface->upload()`
  - Automatic cleanup of old media via Spatie's `singleFile()` collection
  
- Updated all methods returning `LeagueData`:
  - `getUserLeagues()`
  - `getLeagueById()`
  - `getLeagueForAdmin()`
  - `archiveLeague()`
  - `getAllLeaguesForAdmin()`
  - `getPublicLeagues()`
  
- All methods now load Eloquent model with media relationships for DTO creation

### 3. LeagueData DTO Updates
**File:** `app/Application/League/DTOs/LeagueData.php`

**New Properties (with backward compatibility):**
```php
// OLD FORMAT (deprecated but maintained)
public readonly ?string $logo_url;
public readonly ?string $header_image_url;
public readonly ?string $banner_url;

// NEW FORMAT
public readonly ?array $logo;
public readonly ?array $header_image;
public readonly ?array $banner;
```

**New Media Response Structure:**
```json
{
  "logo": {
    "id": 123,
    "original": "https://domain.com/storage/media/123/logo.png",
    "conversions": {
      "thumb": "https://domain.com/.../logo-thumb.webp",
      "small": "https://domain.com/.../logo-small.webp",
      "medium": "https://domain.com/.../logo-medium.webp",
      "large": "https://domain.com/.../logo-large.webp",
      "og": "https://domain.com/.../logo-og.webp"
    },
    "srcset": "...thumb.webp 150w, ...small.webp 320w, ...medium.webp 640w, ...large.webp 1280w"
  }
}
```

**Added Methods:**
- `mediaToArray(?Media $media): ?array` - Converts Spatie Media model to API response array
- Updated `fromEntity()` to accept optional `$eloquentModel` parameter

### 4. PublicLeagueData DTO Updates
**File:** `app/Application/League/DTOs/PublicLeagueData.php`

- Same structure as LeagueData (new + old format)
- Updated `fromEntity()` method to handle media
- Added `mediaToArray()` helper method

### 5. Image Conversions Generated
Via `HasMediaCollections` trait, all uploaded images automatically generate:
- **thumb**: 150x150 (square, for avatars/thumbnails)
- **small**: 320px width (mobile)
- **medium**: 640px width (tablet)
- **large**: 1280px width (desktop)
- **og**: 1200x630 (social sharing - Open Graph)
- All in WebP format for optimal file size

### 6. Static Analysis Fixes
**Files Updated:**
- `app/Infrastructure/Persistence/Eloquent/Traits/HasMediaCollections.php`
  - Fixed `Fit::Crop` enum usage for PHPStan
- `phpstan.neon`
  - Removed unused trait ignore pattern
- `app/Application/League/Services/LeagueApplicationService.php`
  - Fixed variable checks for PHPStan
  - Removed unused `cleanupUploadedFiles()` method

## Testing

### Tests Passed
- All 63 League controller tests passing
- All 231 assertions successful
- PHPStan level 8 - No errors
- PHPCS - No errors (only warnings for line length in test files)

### Test Coverage
- League creation with logo, header image, banner
- League updates with media replacement
- Media deletion on entity deletion (via Spatie's cascade)
- API response structure verification
- Backward compatibility maintained

## Backward Compatibility

**Dual-Write Strategy:**
- Images uploaded to BOTH old Storage system AND new Media Library
- Old `logo_url`, `header_image_url`, `banner_url` fields still populated
- Frontend can migrate gradually without breaking changes
- New `logo`, `header_image`, `banner` objects available for frontends that want responsive images

**Migration Path for Frontend:**
1. Frontend reads both old URL fields and new media objects
2. Gradually update components to use new media objects with srcset
3. Eventually deprecate old URL fields
4. Remove old Storage files after confirming all systems use new media

## Architecture Benefits

1. **DDD Compliant** - Domain layer remains pure, infrastructure handles media
2. **Automatic Optimization** - All images converted to WebP automatically
3. **Responsive Images** - srcset generated for all sizes
4. **Clean Separation** - MediaServiceInterface abstracts Spatie implementation
5. **Cascade Deletion** - Media automatically deleted when League deleted
6. **Queue Ready** - Image conversions run in background queue

## Next Steps (Other Entities)

Use this League integration as template for:
1. Season entity (logo + banner)
2. Competition entity (logo)
3. Team entity (logo)
4. Division entity (logo)
5. SiteConfig entity (logo, favicon, og_image)

## API Response Example

**Before (Old Format Only):**
```json
{
  "logo_url": "/storage/leagues/logos/abc123.png"
}
```

**After (Both Formats):**
```json
{
  "logo_url": "/storage/leagues/logos/abc123.png",
  "logo": {
    "id": 123,
    "original": "/storage/media/123/abc123.png",
    "conversions": {
      "thumb": "/storage/media/123/conversions/abc123-thumb.webp",
      "medium": "/storage/media/123/conversions/abc123-medium.webp",
      "large": "/storage/media/123/conversions/abc123-large.webp"
    },
    "srcset": "...thumb.webp 150w, ...medium.webp 640w, ...large.webp 1280w"
  }
}
```

## Files Modified

### Core Changes
- `app/Infrastructure/Persistence/Eloquent/Models/League.php`
- `app/Application/League/Services/LeagueApplicationService.php`
- `app/Application/League/DTOs/LeagueData.php`
- `app/Application/League/DTOs/PublicLeagueData.php`

### Supporting Changes
- `app/Infrastructure/Persistence/Eloquent/Traits/HasMediaCollections.php`
- `phpstan.neon`

### Tests
- All existing tests updated and passing
- No new test files required (existing tests cover media integration)

## Performance Notes

- Media relationships loaded only when needed (not eager-loaded by repository)
- Eloquent models fetched separately when media data required
- No performance degradation - tests remain fast
- Queue workers should be running for async image conversions

## Documentation References

- [Phase 1 Architecture Plan](./01-media-management-architecture-plan.md)
- [Implementation Overview](./02-media-implementation-overview.md)
- Spatie Media Library Docs: https://spatie.be/docs/laravel-medialibrary/v11

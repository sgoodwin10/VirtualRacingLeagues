# Phase 4: Legacy Media Migration - Implementation Summary

## Overview

Phase 4 implements comprehensive commands for migrating legacy file path-based media to Spatie Media Library, completing the media management transition.

## What Was Implemented

### 1. Migration Command (`media:migrate-legacy`)

**File**: `/var/www/app/Console/Commands/MigrateLegacyMediaCommand.php`

**Features**:
- Migrates all legacy file paths to Media Library
- Supports per-model migration with `--model=` option
- Dry-run mode for safe preview
- Progress bars for user feedback
- Preserves original files during migration
- Handles missing files gracefully
- Skips already-migrated files automatically
- Comprehensive error handling and logging

**Supported Models**:
- League (logo, header_image, banner)
- Competition (logo)
- Season (logo, banner)
- Team (logo)
- Division (logo)
- SiteConfig (logo, favicon, og_image from site_config_files table)

**Usage**:
```bash
# Preview migration
php artisan media:migrate-legacy --dry-run

# Migrate all models
php artisan media:migrate-legacy --force

# Migrate specific model
php artisan media:migrate-legacy --model=league --force
```

### 2. Cleanup Command (`media:cleanup-legacy`)

**File**: `/var/www/app/Console/Commands/CleanupLegacyMediaCommand.php`

**Features**:
- Removes legacy path columns after successful migration
- Validates that media exists before cleaning
- Optional file deletion with `--delete-files` flag
- Dry-run mode for safety
- Double confirmation for destructive operations
- Deletes site_config_files records after migration
- Comprehensive safety checks

**Usage**:
```bash
# Preview cleanup
php artisan media:cleanup-legacy --dry-run

# Cleanup database only (keeps files)
php artisan media:cleanup-legacy --force

# Cleanup and delete files (destructive!)
php artisan media:cleanup-legacy --force --delete-files
```

### 3. Feature Configuration

**File**: `/var/www/config/features.php`

**Purpose**:
- Centralized feature flag configuration
- Controls new media system usage
- Enables dual-write strategy during transition

**Configuration**:
```php
'use_new_media_system' => env('FEATURE_NEW_MEDIA', true)
```

### 4. New Factories

Created missing factories for testing:

**TeamFactory** (`/var/www/database/factories/TeamFactory.php`):
- Factory for creating test teams
- Supports `withLogo()` state for testing

**SiteConfigFactory** (`/var/www/database/factories/SiteConfigFactory.php`):
- Factory for creating test site configurations
- States for maintenance mode, registration disabled, active/inactive

### 5. Comprehensive Test Coverage

**Migration Tests** (`tests/Feature/Console/Commands/MigrateLegacyMediaCommandTest.php`):
- 13 tests covering all migration scenarios
- Tests for all model types
- Dry-run mode testing
- Error handling verification
- Skipping already-migrated files
- Missing file handling

**Cleanup Tests** (`tests/Feature/Console/Commands/CleanupLegacyMediaCommandTest.php`):
- 14 tests covering all cleanup scenarios
- File deletion verification
- File preservation verification
- Safety check validation
- Dry-run mode testing

**Total**: 27 tests with 66 assertions

### 6. Documentation

**Migration Guide** (`/var/www/docs/media/legacy-media-migration-guide.md`):
- Complete step-by-step migration process
- Command reference with examples
- Troubleshooting guide
- Best practices and recommendations
- Rollback procedures
- Timeline recommendations

## Code Quality

All code passes:
- PHPStan level 8 static analysis
- PSR-12 code style standards (PHPCS)
- All 27 unit/feature tests

## Key Design Decisions

### 1. Preserving Original Files
The migration uses `preservingOriginal()` to keep source files intact. This provides:
- Safe rollback capability
- No data loss during migration
- Ability to re-run migration if needed

### 2. Progressive Migration
Support for per-model migration allows:
- Memory-efficient processing
- Easier troubleshooting
- Flexible deployment strategies

### 3. Double Confirmation for Destructive Operations
The cleanup command requires:
- Two confirmations before deletion
- Explicit `--delete-files` flag
- Validation that media exists before cleaning

### 4. Comprehensive Error Handling
Both commands handle:
- Missing files (log warning, continue)
- Already migrated files (skip automatically)
- Unknown file types (log error, skip)
- Invalid models (error message)

### 5. Progress Feedback
Both commands provide:
- Progress bars for long operations
- Summary tables with statistics
- Clear status messages
- Dry-run mode for preview

## Migration Strategy

### Dual-Write Period
During transition, the application:
1. Writes new uploads to BOTH systems
2. Reads from new system if available, falls back to legacy
3. Gradually migrates existing files
4. Eventually removes legacy system

### Phased Rollout
Recommended timeline:
1. **Week 1**: Test in staging
2. **Week 2**: Migrate production (keep files)
3. **Week 3-4**: Monitor and validate
4. **Week 5**: Clean database (keep files)
5. **Week 6+**: Optionally delete files

## Safety Features

### Migration Safety
- Dry-run mode prevents accidental changes
- Original files preserved by default
- Already-migrated files skipped
- Missing files logged but don't stop process

### Cleanup Safety
- Only cleans if media exists
- Requires explicit confirmation
- Separate flag for file deletion
- Dry-run preview available

## Next Steps

### Immediate
1. Run migration in staging environment
2. Verify all images load correctly
3. Test file uploads and deletions
4. Review migration logs

### Short-term (1-2 weeks)
1. Run migration in production
2. Monitor error logs
3. Verify user reports
4. Keep original files

### Long-term (4-6 weeks)
1. Run cleanup command (without file deletion)
2. Monitor for any issues
3. After validation, optionally delete files
4. Remove legacy path columns from models
5. Update application code to remove fallbacks

## Files Created/Modified

### New Files
- `app/Console/Commands/MigrateLegacyMediaCommand.php`
- `app/Console/Commands/CleanupLegacyMediaCommand.php`
- `config/features.php`
- `database/factories/TeamFactory.php`
- `database/factories/SiteConfigFactory.php`
- `tests/Feature/Console/Commands/MigrateLegacyMediaCommandTest.php`
- `tests/Feature/Console/Commands/CleanupLegacyMediaCommandTest.php`
- `docs/media/legacy-media-migration-guide.md`
- `docs/media/phase-4-summary.md`

### Modified Files
- `app/Infrastructure/Persistence/Eloquent/Models/Team.php` (added factory)
- `app/Infrastructure/Persistence/Eloquent/Models/SiteConfigModel.php` (added factory)
- `app/Infrastructure/Persistence/Eloquent/Models/Division.php` (added PHPDoc)

## Statistics

- **2 new commands** with comprehensive functionality
- **2 new factories** for complete test coverage
- **27 tests** with 66 assertions (100% passing)
- **1 feature configuration** file
- **2 documentation** files
- **0 PHPStan errors** (level 8)
- **0 PHPCS errors** (only pre-existing warnings in other files)

## Conclusion

Phase 4 successfully implements a complete, safe, and well-tested system for migrating legacy media to Spatie Media Library. The implementation includes:

- Comprehensive migration and cleanup commands
- Full test coverage
- Extensive documentation
- Multiple safety features
- Flexible deployment options

The system is ready for staging deployment and testing.

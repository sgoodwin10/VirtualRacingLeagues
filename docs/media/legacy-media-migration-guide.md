# Legacy Media Migration Guide

## Overview

This guide explains how to migrate legacy file path-based media storage to the new Spatie Media Library system.

## Background

The application is transitioning from storing file paths directly in database columns to using Spatie Media Library for managing all media files. This provides:

- Unified media management interface
- Built-in responsive image generation
- Organized file storage
- Better separation of concerns
- Easier media manipulation

## Migration Process

### Phase 1: Review Current State

Before migrating, review your current media files:

```bash
# Check if you have any legacy media
php artisan media:migrate-legacy --dry-run
```

This will show you:
- How many files will be migrated
- Which models have legacy media
- Any missing files

### Phase 2: Run Migration

Once you've reviewed the dry run, execute the migration:

```bash
# Migrate all models
php artisan media:migrate-legacy --force

# Or migrate specific models
php artisan media:migrate-legacy --model=league --force
php artisan media:migrate-legacy --model=competition --force
php artisan media:migrate-legacy --model=season --force
php artisan media:migrate-legacy --model=team --force
php artisan media:migrate-legacy --model=division --force
php artisan media:migrate-legacy --model=siteconfig --force
```

**Important Notes:**
- The migration uses `preservingOriginal()` - original files are NOT deleted
- Already migrated files are skipped automatically
- Missing files are logged but don't stop the migration

### Phase 3: Verify Migration

After migration, verify everything works correctly:

1. **Check the UI**: Browse through your application and verify all images display correctly
2. **Check the database**: Verify media records were created
   ```sql
   SELECT * FROM media WHERE model_type = 'App\\Infrastructure\\Persistence\\Eloquent\\Models\\League';
   ```
3. **Check file storage**: Files should exist in both old and new locations
   - Old: `storage/app/public/leagues/logo.jpg`
   - New: `storage/app/public/media/{id}/logo.jpg`

### Phase 4: Cleanup Legacy Data

Once you've verified the migration was successful and your application works correctly, clean up legacy data:

```bash
# Preview what will be cleaned (safe to run)
php artisan media:cleanup-legacy --dry-run

# Cleanup database records only (keeps files)
php artisan media:cleanup-legacy --force

# Cleanup database records AND delete files
php artisan media:cleanup-legacy --force --delete-files
```

**Warning:** The `--delete-files` flag is **destructive** and cannot be undone. Only use it after thorough verification.

### Phase 5: Update Application Code

After cleanup, you can remove legacy path accessors and update your application code to use Media Library exclusively.

## Command Reference

### `media:migrate-legacy`

Migrate legacy file paths to Spatie Media Library.

**Options:**
- `--model=MODEL`: Migrate specific model only (league, competition, season, team, division, siteconfig)
- `--dry-run`: Preview changes without making them
- `--force`: Skip confirmation prompts

**Examples:**
```bash
# Dry run for all models
php artisan media:migrate-legacy --dry-run

# Migrate leagues only
php artisan media:migrate-legacy --model=league --force

# Migrate all models (interactive)
php artisan media:migrate-legacy
```

### `media:cleanup-legacy`

Remove legacy file paths from database after successful migration.

**Options:**
- `--model=MODEL`: Cleanup specific model only
- `--dry-run`: Preview changes without making them
- `--force`: Skip confirmation prompts
- `--delete-files`: Also delete physical files (use with caution!)

**Examples:**
```bash
# Dry run for all models
php artisan media:cleanup-legacy --dry-run

# Cleanup leagues only (keep files)
php artisan media:cleanup-legacy --model=league --force

# Cleanup all and delete files (destructive!)
php artisan media:cleanup-legacy --force --delete-files
```

## Affected Models

### League
- `logo_path` → `logo` collection
- `header_image_path` → `header_image` collection
- `banner_path` → `banner` collection

### Competition
- `logo_path` → `logo` collection

### Season
- `logo_path` → `logo` collection
- `banner_path` → `banner` collection

### Team
- `logo_url` → `logo` collection

### Division
- `logo_url` → `logo` collection

### SiteConfig
- Migrates from `site_config_files` table
- `file_type='logo'` → `logo` collection
- `file_type='favicon'` → `favicon` collection
- `file_type='og_image'` → `og_image` collection

## Feature Flag

The feature flag `FEATURE_NEW_MEDIA` controls whether new uploads use the Media Library:

```env
# .env
FEATURE_NEW_MEDIA=true  # Use Media Library for new uploads
```

During transition, the application uses a dual-write strategy where files are written to both systems.

## Troubleshooting

### Issue: "File not found" errors during migration

**Solution:** Some files may have been deleted or moved. The migration will log these and continue. Review the warnings and manually address missing files if needed.

### Issue: "Media already exists" errors

**Solution:** The migration skips files that have already been migrated. This is normal behavior if you're re-running the migration.

### Issue: Out of memory during migration

**Solution:** Migrate models one at a time using the `--model` flag:
```bash
php artisan media:migrate-legacy --model=league --force
php artisan media:migrate-legacy --model=competition --force
# etc.
```

### Issue: Application shows broken images after migration

**Solution:**
1. Check that media records were created: `php artisan media:list`
2. Verify files exist in new location: `ls -la storage/app/public/media/`
3. Clear application cache: `php artisan cache:clear`
4. Regenerate storage link: `php artisan storage:link`

## Rollback Plan

If you need to rollback after cleanup:

1. **If you kept files (no `--delete-files`)**: Files still exist, just restore database columns
2. **If you deleted files**: Restore from backup - this is why we recommend keeping files initially

## Best Practices

1. **Always test on staging first**
2. **Run with `--dry-run` before actual migration**
3. **Back up your database before cleanup**
4. **Keep original files for at least 30 days**
5. **Monitor error logs during migration**
6. **Verify in production before running cleanup**

## Timeline Recommendation

1. **Week 1**: Run migration in staging, test thoroughly
2. **Week 2**: Run migration in production (keeps original files)
3. **Week 3-4**: Monitor production, verify everything works
4. **Week 5**: Run cleanup (without `--delete-files`)
5. **Week 6+**: Monitor for issues, then optionally delete files

## Support

If you encounter issues during migration, check:
- Laravel logs: `storage/logs/laravel.log`
- Command output for specific error messages
- Media Library documentation: https://spatie.be/docs/laravel-medialibrary/

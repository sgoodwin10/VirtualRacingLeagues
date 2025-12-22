# Database Backup Seeders

This directory contains Laravel seeders that serve as a backup mechanism for critical racing data tables.

**Generated:** 2025-12-22

## Overview

These seeders were created to backup and restore data from the following tables:
- `seasons` (1 record)
- `teams` (3 records)
- `divisions` (4 records)
- `season_drivers` (62 records)
- `rounds` (7 records)
- `races` (17 records)
- `race_results` (90 records)

**Total Records:** 184

## Usage

### Restore All Tables

To restore all backup data in the correct order (respecting foreign key dependencies):

```bash
php artisan db:seed --class="Database\Seeders\Backup\DatabaseBackupSeeder"
```

### Restore Individual Tables

You can also restore individual tables if needed:

```bash
# Restore seasons only
php artisan db:seed --class="Database\Seeders\Backup\SeasonsBackupSeeder"

# Restore teams only
php artisan db:seed --class="Database\Seeders\Backup\TeamsBackupSeeder"

# Restore divisions only
php artisan db:seed --class="Database\Seeders\Backup\DivisionsBackupSeeder"

# Restore season drivers only
php artisan db:seed --class="Database\Seeders\Backup\SeasonDriversBackupSeeder"

# Restore rounds only
php artisan db:seed --class="Database\Seeders\Backup\RoundsBackupSeeder"

# Restore races only
php artisan db:seed --class="Database\Seeders\Backup\RacesBackupSeeder"

# Restore race results only
php artisan db:seed --class="Database\Seeders\Backup\RaceResultsBackupSeeder"
```

**Note:** When restoring individual tables, you must respect the dependency order (see below).

## Dependency Order

The seeders must be run in this order due to foreign key constraints:

1. **SeasonsBackupSeeder** - Depends on: `competitions`, `users` (must exist)
2. **TeamsBackupSeeder** - Depends on: `seasons`
3. **DivisionsBackupSeeder** - Depends on: `seasons`
4. **SeasonDriversBackupSeeder** - Depends on: `seasons`, `league_drivers`, `teams`, `divisions`
5. **RoundsBackupSeeder** - Depends on: `seasons`, `platform_tracks`, `users`
6. **RacesBackupSeeder** - Depends on: `rounds`, `races` (self-reference for grid_source_race_id)
7. **RaceResultsBackupSeeder** - Depends on: `races`, `season_drivers`, `divisions`

## Safety Features

All seeders include the following safety features:

1. **Production Environment Protection**: Seeders will NOT run in production environment
2. **Foreign Key Management**: Temporarily disables foreign key checks during seeding
3. **Idempotent Operations**: Uses `updateOrCreate()` to safely handle existing data
4. **Transaction Safety**: Each seeder can be run multiple times without duplicating data

## How It Works

Each seeder:
1. Checks the environment (prevents running in production)
2. Temporarily disables foreign key checks
3. Uses `updateOrCreate()` to insert or update records based on ID
4. Re-enables foreign key checks
5. Displays a success message with record count

## Data Preservation

The seeders preserve:
- All primary keys (IDs)
- Foreign key relationships
- Timestamps (created_at, updated_at)
- Complex JSON fields (points_system, round_results, etc.)
- All nullable fields with correct null handling
- Boolean fields with proper true/false values

## Prerequisites

Before running the backup seeders, ensure the following tables have the required data:

- `competitions` - Competition with ID 1 must exist
- `users` - Users with IDs 1 and 4 must exist
- `league_drivers` - All league drivers referenced in season_drivers must exist
- `platform_tracks` - All platform tracks referenced in rounds must exist

## Regenerating Backup Seeders

If you need to regenerate these seeders with updated data:

1. Export the current data from the database (using the original export scripts)
2. Regenerate the seeder files using the generation scripts
3. Test the seeders in a development environment
4. Update this README with new record counts and generation date

## File Structure

```
database/seeders/Backup/
├── README.md                        # This file
├── DatabaseBackupSeeder.php         # Master seeder (runs all in order)
├── SeasonsBackupSeeder.php          # Seasons table backup
├── TeamsBackupSeeder.php            # Teams table backup
├── DivisionsBackupSeeder.php        # Divisions table backup
├── SeasonDriversBackupSeeder.php    # Season drivers table backup
├── RoundsBackupSeeder.php           # Rounds table backup
├── RacesBackupSeeder.php            # Races table backup
└── RaceResultsBackupSeeder.php      # Race results table backup
```

## Troubleshooting

### Foreign Key Constraint Errors

If you encounter foreign key constraint errors:
1. Ensure all prerequisite tables have the required data (see Prerequisites)
2. Run seeders in the correct dependency order
3. Check that foreign key checks are properly managed in the seeder

### Duplicate Key Errors

If you encounter duplicate key errors:
1. The seeders should use `updateOrCreate()` which prevents duplicates
2. If the error persists, check for unique constraints on columns other than ID
3. Consider truncating the table first (⚠️ WARNING: This will delete all existing data)

### Production Environment Error

If you see "cannot run in production environment":
1. This is by design to protect production data
2. Only run these seeders in local, development, or staging environments
3. If you absolutely need to run in production, modify the environment check (NOT RECOMMENDED)

## Notes

- These seeders use `updateOrCreate()` which means running them multiple times will update existing records rather than create duplicates
- All JSON fields are properly escaped and stored as strings
- Boolean fields are stored as `true`/`false` in PHP, which Laravel converts to 1/0 in MySQL
- Nullable fields are properly handled with `null` values
- Timestamps are preserved from the original backup data

## Support

For issues or questions about these backup seeders, please contact the development team.

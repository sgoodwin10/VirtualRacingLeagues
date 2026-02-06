# Database Backup Seeders

This directory contains Laravel seeders that serve as a backup mechanism for critical racing data tables.

**Generated:** 2026-02-06

## Overview

These seeders were created to backup and restore data from the following tables (filtered for users 1 and 3):
- `users` (2 records)
- `leagues` (1 records)
- `drivers` (80 records)
- `league_drivers` (80 records)
- `competitions` (1 records)
- `seasons` (1 records)
- `teams` (3 records)
- `divisions` (4 records)
- `season_drivers` (62 records)
- `rounds` (7 records)
- `races` (17 records)
- `race_results` (697 records)

**Total Records:** 955

## Usage

### Restore All Tables

To restore all backup data in the correct order (respecting foreign key dependencies):

```bash
php artisan db:seed --class="Database\Seeders\Backup\DatabaseBackupSeeder"
```

### Restore Individual Tables

You can also restore individual tables if needed:

```bash
# Restore users only
php artisan db:seed --class="Database\Seeders\Backup\UsersBackupSeeder"

# Restore leagues only
php artisan db:seed --class="Database\Seeders\Backup\LeaguesBackupSeeder"

# Restore drivers only
php artisan db:seed --class="Database\Seeders\Backup\DriversBackupSeeder"

# Restore league drivers only
php artisan db:seed --class="Database\Seeders\Backup\LeagueDriversBackupSeeder"

# Restore competitions only
php artisan db:seed --class="Database\Seeders\Backup\CompetitionsBackupSeeder"

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

1. **UsersBackupSeeder** - No dependencies (must run first)
2. **LeaguesBackupSeeder** - Depends on: `users`
3. **DriversBackupSeeder** - No dependencies
4. **LeagueDriversBackupSeeder** - Depends on: `leagues`, `drivers`
5. **CompetitionsBackupSeeder** - Depends on: `leagues`, `platforms` (PlatformSeeder must exist)
6. **SeasonsBackupSeeder** - Depends on: `competitions`, `users`
7. **TeamsBackupSeeder** - Depends on: `seasons`
8. **DivisionsBackupSeeder** - Depends on: `seasons`
9. **SeasonDriversBackupSeeder** - Depends on: `seasons`, `league_drivers`, `teams`, `divisions`
10. **RoundsBackupSeeder** - Depends on: `seasons`, `platform_tracks`, `users`
11. **RacesBackupSeeder** - Depends on: `rounds`, `races` (self-reference for grid_source_race_id)
12. **RaceResultsBackupSeeder** - Depends on: `races`, `season_drivers`, `divisions`

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

- `platforms` - Platform records must exist (run PlatformSeeder first)
- `platform_tracks` - All platform tracks referenced in rounds must exist

**Note:** This backup is filtered to include only data for users 1 and 3 and their associated leagues, competitions, and racing data.

## Regenerating Backup Seeders

If you need to regenerate these seeders with updated data:

```bash
php generate_backup_seeders.php
```

This will:
1. Export the current data from the database
2. Regenerate all seeder files
3. Update this README with new record counts and generation date

## File Structure

```
database/seeders/Backup/
├── README.md                        # This file
├── DatabaseBackupSeeder.php         # Master seeder (runs all in order)
├── UsersBackupSeeder.php            # Users table backup
├── LeaguesBackupSeeder.php          # Leagues table backup
├── DriversBackupSeeder.php          # Drivers table backup
├── LeagueDriversBackupSeeder.php    # League drivers table backup
├── CompetitionsBackupSeeder.php     # Competitions table backup
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

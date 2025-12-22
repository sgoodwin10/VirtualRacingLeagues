# Database Backup Seeders - Usage Guide

## Overview

This directory contains Laravel seeders that serve as a comprehensive backup mechanism for your racing league data. All seeders have been tested and verified to work correctly.

**Created:** 2025-12-22
**Total Records Backed Up:** ~171 records across 7 tables

## Quick Start

### Restore All Data (Recommended)

```bash
php artisan db:seed --class="Database\Seeders\Backup\DatabaseBackupSeeder"
```

This master seeder will:
1. Restore all 7 tables in the correct dependency order
2. Show progress for each table
3. Display total records restored
4. Complete in under 1 second

Expected output:
```
========================================
DATABASE BACKUP RESTORATION
========================================
This will restore backup data for the following tables:
  - seasons
  - teams
  - divisions
  - season_drivers
  - rounds
  - races
  - race_results
========================================

Step 1/7: Restoring seasons...
Seasons backup seeded successfully. Total records: 1

Step 2/7: Restoring teams...
Teams backup seeded successfully. Total records: 3

... (continues for all tables)

========================================
DATABASE BACKUP RESTORATION COMPLETE!
========================================
```

## Individual Table Restoration

You can also restore individual tables if needed:

### 1. Seasons
```bash
php artisan db:seed --class="Database\Seeders\Backup\SeasonsBackupSeeder"
```
Restores: 1 season record

### 2. Teams
```bash
php artisan db:seed --class="Database\Seeders\Backup\TeamsBackupSeeder"
```
Restores: 3 team records (depends on seasons)

### 3. Divisions
```bash
php artisan db:seed --class="Database\Seeders\Backup\DivisionsBackupSeeder"
```
Restores: 4 division records (depends on seasons)

### 4. Season Drivers
```bash
php artisan db:seed --class="Database\Seeders\Backup\SeasonDriversBackupSeeder"
```
Restores: 62 season driver records (depends on seasons, teams, divisions, league_drivers)

### 5. Rounds
```bash
php artisan db:seed --class="Database\Seeders\Backup\RoundsBackupSeeder"
```
Restores: 7 round records (depends on seasons, platform_tracks, users)

### 6. Races
```bash
php artisan db:seed --class="Database\Seeders\Backup\RacesBackupSeeder"
```
Restores: 4 race records (depends on rounds)

### 7. Race Results
```bash
php artisan db:seed --class="Database\Seeders\Backup\RaceResultsBackupSeeder"
```
Restores: 90 race result records (depends on races, season_drivers, divisions)

## Important Notes

### Dependency Order

When restoring individual tables, you **MUST** follow this order:

```
1. Seasons
   ├── 2. Teams
   ├── 3. Divisions
   │   └── 4. Season Drivers
   └── 5. Rounds
       └── 6. Races
           └── 7. Race Results
```

### Prerequisites

Before running any seeders, ensure these tables have required data:

- **competitions** - Competition with ID 1 must exist
- **users** - Users with IDs 1 and 4 must exist
- **league_drivers** - All league drivers referenced in season_drivers (IDs 1-68) must exist
- **platform_tracks** - All platform tracks referenced in rounds (IDs 3, 5, 69, 81, 89, 110, 116) must exist

### Safety Features

All seeders include these safety features:

1. **Production Protection**
   - Seeders will refuse to run in production environment
   - Prevents accidental data overwrites

2. **Idempotent Operations**
   - Uses `updateOrCreate()` instead of `create()`
   - Safe to run multiple times
   - Will update existing records with matching IDs

3. **Foreign Key Management**
   - Temporarily disables foreign key checks during seeding
   - Re-enables them after completion
   - Ensures smooth data restoration

4. **Data Integrity**
   - Preserves all primary keys (IDs)
   - Maintains foreign key relationships
   - Keeps original timestamps

## Testing

All seeders have been tested and verified:

```bash
# Tested successfully:
✓ SeasonsBackupSeeder - 1 record restored
✓ TeamsBackupSeeder - 3 records restored
✓ DivisionsBackupSeeder - 4 records restored
✓ SeasonDriversBackupSeeder - 62 records restored
✓ RoundsBackupSeeder - 7 records restored
✓ RacesBackupSeeder - 4 records restored
✓ RaceResultsBackupSeeder - 90 records restored
```

## What Gets Backed Up

### Full Data Backup
These tables have complete data backups:
- **seasons** - All season configuration and settings
- **teams** - Team names, logos, and season associations
- **divisions** - Division structure and ordering
- **season_drivers** - Driver registrations, team assignments, divisions
- **race_results** - All race results with positions, times, points
- **races** - Race configurations and settings
- **rounds** - Round schedules and configurations

### Partial Data Backup
- **rounds** - Basic round data (JSON result fields excluded as they're dynamically generated)

### Excluded Data
These are dynamically generated and not included:
- `round_results` (in rounds table)
- `qualifying_results` (in rounds table)
- `race_time_results` (in rounds table)
- `fastest_lap_results` (in rounds table)

**Note:** These JSON fields are calculated from the `race_results` table and will be regenerated when the application processes race results.

## Common Use Cases

### 1. Fresh Database Setup
```bash
# After running migrations
php artisan db:seed --class="Database\Seeders\Backup\DatabaseBackupSeeder"
```

### 2. Restore After Data Corruption
```bash
# Restore specific table
php artisan db:seed --class="Database\Seeders\Backup\RaceResultsBackupSeeder"
```

### 3. Development Environment Setup
```bash
# Full restore for dev environment
php artisan migrate:fresh
php artisan db:seed  # Run main seeders first (users, leagues, etc.)
php artisan db:seed --class="Database\Seeders\Backup\DatabaseBackupSeeder"
```

### 4. Staging Environment Sync
```bash
# Restore production-like data to staging
php artisan db:seed --class="Database\Seeders\Backup\DatabaseBackupSeeder"
```

## Troubleshooting

### Error: "Cannot run in production environment"

**Cause:** Seeder safety check preventing production data overwrites

**Solution:** This is intentional. If you absolutely need to run in production:
1. Review the seeder code
2. Understand the implications
3. Temporarily modify the environment check (NOT RECOMMENDED)

### Error: Foreign key constraint fails

**Cause:** Missing prerequisite data

**Solution:**
1. Check that all prerequisite tables have required data
2. Run seeders in the correct dependency order
3. Use the master seeder which handles the order automatically

### Error: Duplicate key violation

**Cause:** Record with same ID already exists

**Solution:** This shouldn't happen as seeders use `updateOrCreate()`. If it does:
1. Check if a unique constraint exists on a column other than ID
2. Consider truncating the table first (⚠️ WARNING: Deletes all data)

## File Structure

```
database/seeders/Backup/
├── README.md                      # Detailed technical documentation
├── USAGE_GUIDE.md                 # This file
├── BACKUP_SUMMARY.txt             # Quick reference summary
├── DatabaseBackupSeeder.php       # Master seeder (orchestrates all)
├── SeasonsBackupSeeder.php        # Seasons table backup
├── TeamsBackupSeeder.php          # Teams table backup
├── DivisionsBackupSeeder.php      # Divisions table backup
├── SeasonDriversBackupSeeder.php  # Season drivers table backup
├── RoundsBackupSeeder.php         # Rounds table backup
├── RacesBackupSeeder.php          # Races table backup
└── RaceResultsBackupSeeder.php    # Race results table backup
```

## Support

For issues or questions:
1. Check the detailed README.md in this directory
2. Review the BACKUP_SUMMARY.txt for quick reference
3. Examine the seeder code for specific implementation details
4. Contact the development team

## Version Information

- **Laravel Version:** 12
- **PHP Version:** 8.2+
- **Database:** MariaDB 10.11
- **Backup Date:** 2025-12-22
- **Total Seeders:** 8 (7 tables + 1 master)
- **Total Records:** ~171

## License

This backup system is part of the Virtual Racing Leagues application.

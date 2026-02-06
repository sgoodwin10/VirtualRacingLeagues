# How to Completely Reset the Site Database

This guide explains how to completely reset the site database as if starting from scratch - perfect for development, testing, or staging environments.

## Overview

A complete database reset will:

1. **Drop all tables** - Removes every table from the database
2. **Run migrations** - Recreates all tables with the correct schema
3. **Run basic seeders** - Populates essential data needed for the application to function

## Prerequisites

- You must be inside the Docker container or have access to the Laravel application
- The database server (MariaDB) must be running
- **Never run this in production** - This will delete all data permanently

## Quick Reset Commands

### Option 1: Fresh Migration with Seeders (Recommended)

This is the cleanest approach - drops all tables and re-runs migrations and seeders:

```bash
php artisan migrate:fresh --seed
```

This command will:
1. Drop all tables from the database
2. Run all migrations to recreate tables
3. Run `DatabaseSeeder` which includes:
   - **Production seeders** (always run):
     - `AdminSeeder` - Creates the super admin account
     - `PlatformSeeder` - Creates gaming platforms (e.g., Gran Turismo 7)
     - `PlatformTrackLocationSeeder` - Creates track locations
     - `PlatformTrackSeeder` - Creates individual tracks
   - **Development seeders** (only in local/development/testing environments):
     - `SiteConfigSeeder` - Site configuration
     - `UserSeeder` - Test users
     - `LeagueSeeder` - Test leagues
     - `DriverSeeder` - Test drivers
     - `CompetitionSeeder` - Test competitions

### Option 2: Manual Step-by-Step Reset

If you need more control over the process:

```bash
# Step 1: Drop all tables and run migrations
php artisan migrate:fresh

# Step 2: Run the default seeders
php artisan db:seed

# Step 3: (Optional) Run the tiebreaker rules seeder if needed
php artisan db:seed --class=RoundTiebreakerRulesSeeder
```

### Option 3: Complete Database Drop (Nuclear Option)

If you need to completely wipe the database including any corrupted state:

```bash
# Drop ALL tables completely
php artisan db:wipe

# Run fresh migrations
php artisan migrate

# Run seeders
php artisan db:seed
```

## What Each Seeder Does

### Production Seeders (Always Run)

| Seeder | Purpose | Records Created |
|--------|---------|-----------------|
| `AdminSeeder` | Creates super admin account (`superadmin@virtualracingleagues.com` / `password`) | 1 admin |
| `PlatformSeeder` | Gaming platforms (GT7, etc.) | Platform data |
| `PlatformTrackLocationSeeder` | Track locations (countries, circuits) | Location data |
| `PlatformTrackSeeder` | Individual track configurations | Track data |

### Development Seeders (Local/Development/Testing Only)

| Seeder | Purpose | Records Created |
|--------|---------|-----------------|
| `SiteConfigSeeder` | Site configuration settings | Config records |
| `UserSeeder` | Test user accounts | Test users |
| `LeagueSeeder` | Test racing leagues | League records |
| `DriverSeeder` | Test driver profiles | Driver records |
| `CompetitionSeeder` | Test competitions | Competition records |
| `AdminSeeder` (dev) | Additional test admins (`admin@example.com`, `moderator@example.com`) | 2 extra admins |

## Default Login Credentials

After running seeders, you can log in with:

**Admin Dashboard** (`admin.virtualracingleagues.localhost/admin`):
- **Super Admin**: `superadmin@virtualracingleagues.com` / `password`
- **Regular Admin** (dev only): `admin@example.com` / `password`
- **Moderator** (dev only): `moderator@example.com` / `password`

## Verification

After reset, verify the database is correctly set up:

```bash
# Check migration status
php artisan migrate:status

# Verify tables exist
php artisan tinker --execute="echo 'Tables: ' . count(Schema::getAllTables());"

# Check admin user exists
php artisan tinker --execute="echo App\Infrastructure\Persistence\Eloquent\Models\AdminEloquent::count() . ' admins';"
```

## Troubleshooting

### Foreign Key Constraint Errors

If you encounter foreign key errors during migration:

```bash
# Try the db:wipe approach instead
php artisan db:wipe
php artisan migrate
php artisan db:seed
```

### Seeder Fails

If a seeder fails:

```bash
# Run seeders individually to identify the problem
php artisan db:seed --class=AdminSeeder
php artisan db:seed --class=PlatformSeeder
php artisan db:seed --class=PlatformTrackLocationSeeder
php artisan db:seed --class=PlatformTrackSeeder
```

### Database Connection Issues

Verify database connectivity:

```bash
# Test connection
php artisan tinker --execute="DB::connection()->getPdo(); echo 'Connected!';"
```

---

## STOP HERE

At this point, your database is completely reset with:
- All tables created with fresh schema
- Essential platform data seeded
- Admin accounts ready
- (In development) Test data seeded

The site is now ready for normal use or testing.

---

## Optional: Restoring Backup Data (Example League Data)

If you want to restore example racing data (seasons, teams, divisions, drivers, rounds, races, and race results), continue reading below.

### About the Backup Seeders

The backup seeders contain a complete example of racing league data that can be used for:
- Testing the full functionality of the application
- Demonstrating the application to stakeholders
- Development and debugging with realistic data

### Prerequisites for Backup Data

Before running backup seeders, the following must exist:
- Competition with ID 1 (created by `CompetitionSeeder`)
- User with ID 1(created by `UserSeeder`)
- League drivers (created by `DriverSeeder` + `LeagueSeeder`)
- Platform tracks (created by `PlatformTrackSeeder`)

### Restoring All Backup Data

To restore all backup data in the correct order:

```bash
php artisan db:seed --class="Database\Seeders\Backup\DatabaseBackupSeeder"
```

This will restore:
- **Seasons** - Season configurations and settings
- **Teams** - Team assignments
- **Divisions** - Division structure
- **Season Drivers** - Driver registrations and team/division assignments
- **Rounds** - Round schedules and configurations
- **Races** - Race configurations
- **Race Results** - Complete race results with positions, times, and points

### Restoring Individual Tables

You can also restore individual tables (must follow dependency order):

```bash
# 1. Seasons first
php artisan db:seed --class="Database\Seeders\Backup\SeasonsBackupSeeder"

# 2. Teams and Divisions (depend on seasons)
php artisan db:seed --class="Database\Seeders\Backup\TeamsBackupSeeder"
php artisan db:seed --class="Database\Seeders\Backup\DivisionsBackupSeeder"

# 3. Season Drivers (depend on seasons, teams, divisions)
php artisan db:seed --class="Database\Seeders\Backup\SeasonDriversBackupSeeder"

# 4. Rounds (depend on seasons)
php artisan db:seed --class="Database\Seeders\Backup\RoundsBackupSeeder"

# 5. Races (depend on rounds)
php artisan db:seed --class="Database\Seeders\Backup\RacesBackupSeeder"

# 6. Race Results (depend on races, season drivers)
php artisan db:seed --class="Database\Seeders\Backup\RaceResultsBackupSeeder"
```

### Dependency Tree

```
seasons
├── teams
├── divisions
│   └── season_drivers (also depends on teams)
└── rounds
    └── races
        └── race_results (also depends on season_drivers)
```

### Safety Features

The backup seeders include:
- **Production protection** - Will not run in production environment
- **Idempotent operations** - Safe to run multiple times (uses `updateOrCreate`)
- **Foreign key management** - Temporarily disables FK checks during seeding

### More Information

For detailed documentation about the backup seeders, see:
- `database/seeders/Backup/README.md` - Technical documentation
- `database/seeders/Backup/USAGE_GUIDE.md` - Usage examples and troubleshooting

---

## Complete Reset + Backup Data (Full Command Sequence)

Here's the complete sequence to reset the database and restore backup data:

```bash
# 1. Complete database reset with base seeders
php artisan migrate:fresh --seed

# 2. (Optional) Restore example racing data
php artisan db:seed --class="Database\Seeders\Backup\DatabaseBackupSeeder"
```

That's it! Your site is now fully reset with optional example data.

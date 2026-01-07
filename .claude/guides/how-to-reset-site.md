# How to Reset the Site Database

This guide covers how to completely reset the database and re-run migrations and seeders in this Laravel application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Reset Options](#quick-reset-options)
- [Step-by-Step Methods](#step-by-step-methods)
- [Seeder Information](#seeder-information)
- [Troubleshooting](#troubleshooting)
- [Advanced Options](#advanced-options)

## Prerequisites

Before resetting the database, ensure:

1. **Docker containers are running**:
   ```bash
   docker-compose up -d
   ```

2. **Verify MariaDB is healthy**:
   ```bash
   docker-compose ps mariadb
   ```
   You should see `healthy` in the status.

3. **Database credentials are correct** in `.env`:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=mariadb
   DB_PORT=3306
   DB_DATABASE=virtualracingleagues
   DB_USERNAME=laravel
   DB_PASSWORD=secret
   ```

## Quick Reset Options

### Option 1: Fresh Migration with Default Seeders (Recommended)

This drops all tables, re-runs migrations, and seeds with production + development data:

```bash
php artisan migrate:fresh --seed
```

**What this does:**
- Drops all tables in the database
- Re-runs all migrations
- Seeds production data (Admins, Platforms, Platform Tracks)
- Seeds development data (Site Config, Users, Leagues, Drivers, Competitions)

**Best for:** Starting fresh with clean test data

### Option 2: Fresh Migration with Backup Seeders

This restores your backed-up racing data (seasons, rounds, races, results):

```bash
# Drop all tables and re-run migrations
php artisan migrate:fresh

# Run default seeders first (required for foreign key dependencies)
php artisan db:seed

# Then restore backup data
php artisan db:seed --class="Database\\Seeders\\Backup\\DatabaseBackupSeeder"
```

**Best for:** Restoring your actual racing data after a reset

### Option 3: Refresh Migrations (Rollback + Re-run)

This rolls back and re-runs migrations without dropping tables:

```bash
php artisan migrate:refresh --seed
```

**What this does:**
- Rolls back all migrations (uses `down()` methods)
- Re-runs all migrations (uses `up()` methods)
- Seeds the database

**Best for:** When you want to maintain some data structure but reset everything

## Step-by-Step Methods

### Method 1: Complete Fresh Start

**Use Case:** You want to completely start over with a clean slate.

```bash
# Step 1: Drop all tables
php artisan db:wipe

# Step 2: Run all migrations
php artisan migrate

# Step 3: Seed the database
php artisan db:seed
```

### Method 2: Reset and Restore Backup Data

**Use Case:** You want to reset everything but restore your backed-up racing data.

```bash
# Step 1: Drop all tables and re-run migrations
php artisan migrate:fresh

# Step 2: Run default seeders (required dependencies)
php artisan db:seed

# Step 3: Restore backup data (803 records)
php artisan db:seed --class="Database\\Seeders\\Backup\\DatabaseBackupSeeder"
```

### Method 3: Manual Database Reset (Nuclear Option)

**Use Case:** Artisan commands are failing or you need complete control.

```bash
# Step 1: Access MariaDB container
mysql -h mariadb -u laravel -psecret --skip-ssl

# Step 2: Drop and recreate database
DROP DATABASE IF EXISTS virtualracingleagues;
CREATE DATABASE virtualracingleagues CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE virtualracingleagues;
exit;

# Step 3: Run migrations
php artisan migrate

# Step 4: Seed the database
php artisan db:seed
```

### Method 4: Quick Development Reset

**Use Case:** You're actively developing and want to quickly reset test data.

```bash
# One command to rule them all
php artisan migrate:fresh --seed

# Or with backup data
php artisan migrate:fresh && php artisan db:seed && php artisan db:seed --class="Database\\Seeders\\Backup\\DatabaseBackupSeeder"
```

## Seeder Information

### Default Seeders (DatabaseSeeder)

Located at: `database/seeders/DatabaseSeeder.php`

**Production Seeders (Always Run):**
- `AdminSeeder` - Creates default admin users
- `PlatformSeeder` - Seeds gaming platforms (iRacing, ACC, etc.)
- `PlatformTrackLocationSeeder` - Seeds track locations
- `PlatformTrackSeeder` - Seeds tracks for each platform

**Development Seeders (Only in local/development/testing):**
- `SiteConfigSeeder` - Site configuration
- `UserSeeder` - Test users
- `LeagueSeeder` - Test leagues
- `DriverSeeder` - Test drivers
- `CompetitionSeeder` - Test competitions

**Run default seeders:**
```bash
php artisan db:seed
```

### Backup Seeders

Located at: `database/seeders/Backup/`

These seeders restore actual racing data:
- 6 seasons
- 3 teams
- 4 divisions
- 62 season drivers
- 12 rounds
- 19 races
- 697 race results

**Total: 803 records**

**Run all backup seeders (in correct order):**
```bash
php artisan db:seed --class="Database\\Seeders\\Backup\\DatabaseBackupSeeder"
```

**Run individual backup seeders (must respect dependency order):**
```bash
# 1. Seasons first
php artisan db:seed --class="Database\\Seeders\\Backup\\SeasonsBackupSeeder"

# 2. Teams
php artisan db:seed --class="Database\\Seeders\\Backup\\TeamsBackupSeeder"

# 3. Divisions
php artisan db:seed --class="Database\\Seeders\\Backup\\DivisionsBackupSeeder"

# 4. Season Drivers
php artisan db:seed --class="Database\\Seeders\\Backup\\SeasonDriversBackupSeeder"

# 5. Rounds
php artisan db:seed --class="Database\\Seeders\\Backup\\RoundsBackupSeeder"

# 6. Races
php artisan db:seed --class="Database\\Seeders\\Backup\\RacesBackupSeeder"

# 7. Race Results
php artisan db:seed --class="Database\\Seeders\\Backup\\RaceResultsBackupSeeder"
```

**Regenerate backup seeders from current database:**
```bash
php generate_backup_seeders.php
```

See `database/seeders/Backup/README.md` for detailed backup seeder documentation.

## Troubleshooting

### Issue: MariaDB Container Not Healthy

**Error:** Connection refused or database not accessible

**Solution:**
```bash
# Check container status
docker-compose ps

# View MariaDB logs
docker-compose logs mariadb

# Restart MariaDB
docker-compose restart mariadb

# Wait for health check
sleep 10

# Verify connection
mysql -h mariadb -u laravel -psecret --skip-ssl virtualracingleagues -e "SELECT 1;"
```

### Issue: Foreign Key Constraint Failures

**Error:** `Cannot add or update a child row: a foreign key constraint fails`

**Solution:**
This happens when seeders run in the wrong order. Always use:
```bash
# Use migrate:fresh which drops all tables cleanly
php artisan migrate:fresh --seed
```

For backup seeders, ensure dependencies exist first:
```bash
# Run default seeders first
php artisan db:seed

# Then run backup seeders
php artisan db:seed --class="Database\\Seeders\\Backup\\DatabaseBackupSeeder"
```

### Issue: Migration Already Exists

**Error:** Migration table shows migrations that don't match files

**Solution:**
```bash
# Reset the migrations table
php artisan migrate:reset

# Re-run migrations
php artisan migrate

# Or do it all at once
php artisan migrate:fresh
```

### Issue: Seeder Class Not Found

**Error:** `Class "Database\Seeders\Backup\DatabaseBackupSeeder" not found`

**Solution:**
```bash
# Regenerate autoload files
composer dump-autoload

# Try again
php artisan db:seed --class="Database\\Seeders\\Backup\\DatabaseBackupSeeder"
```

### Issue: Permission Denied

**Error:** Cannot access database or write to storage

**Solution:**
```bash
# Fix permissions on storage and bootstrap/cache
chmod -R 775 storage bootstrap/cache
chown -R laravel:laravel storage bootstrap/cache

# Or from outside container
docker-compose exec app chmod -R 775 storage bootstrap/cache
docker-compose exec app chown -R laravel:laravel storage bootstrap/cache
```

### Issue: Out of Memory During Migration

**Error:** PHP Fatal error: Allowed memory size exhausted

**Solution:**
```bash
# Increase memory limit temporarily
php -d memory_limit=512M artisan migrate:fresh --seed
```

## Advanced Options

### Reset Only Specific Tables

If you want to reset only certain tables without dropping everything:

```bash
# Access MariaDB
mysql -h mariadb -u laravel -psecret --skip-ssl virtualracingleagues

# Truncate specific tables (respecting foreign keys)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE race_results;
TRUNCATE TABLE races;
TRUNCATE TABLE rounds;
SET FOREIGN_KEY_CHECKS = 1;
exit;

# Re-seed those tables
php artisan db:seed --class="Database\\Seeders\\Backup\\RoundsBackupSeeder"
php artisan db:seed --class="Database\\Seeders\\Backup\\RacesBackupSeeder"
php artisan db:seed --class="Database\\Seeders\\Backup\\RaceResultsBackupSeeder"
```

### Rollback Last Migration Batch

If you just ran a migration and need to undo it:

```bash
# Rollback the last batch
php artisan migrate:rollback

# Rollback last 3 batches
php artisan migrate:rollback --step=3

# See migration status
php artisan migrate:status
```

### Reset Test Database

The project has a separate test database configuration:

```bash
# Set test database in .env
DB_TEST_DATABASE=virtualracingleagues_test

# Create test database
mysql -h mariadb -u laravel -psecret --skip-ssl -e "CREATE DATABASE IF NOT EXISTS virtualracingleagues_test;"

# Run migrations on test database
php artisan migrate --database=testing

# Seed test database
php artisan db:seed --database=testing
```

### Clear All Caches After Reset

After resetting the database, clear all application caches:

```bash
# Clear application cache
php artisan cache:clear

# Clear configuration cache
php artisan config:clear

# Clear route cache
php artisan route:clear

# Clear view cache
php artisan view:clear

# Clear compiled classes
php artisan clear-compiled

# Or all at once
php artisan optimize:clear
```

### Monitor Database During Reset

Watch database operations in real-time:

```bash
# In one terminal, watch MariaDB logs
docker-compose logs -f mariadb

# In another terminal, run your reset command
php artisan migrate:fresh --seed
```

## Database Architecture Notes

### Session Storage

This application stores sessions in the database (not files):
```env
SESSION_DRIVER=database
```

The `sessions` table is created by migration `0001_01_01_000000_create_password_reset_and_sessions_tables.php`

After resetting, all users will be logged out and need to log in again.

### Queue Storage

Queues are also stored in the database:
```env
QUEUE_CONNECTION=database
```

The `jobs` table is created by migration `0001_01_01_000002_create_jobs_table.php`

After resetting, all pending queue jobs will be lost.

### Media Library

The application uses Spatie Media Library for file uploads. Media files are stored in `storage/app/public/media/`.

**After database reset:**
- Media table records are deleted
- Physical files remain in storage
- Run cleanup command to remove orphaned files:
  ```bash
  php artisan media:migrate-legacy
  ```

### Activity Logs

The application uses Spatie Activity Log to track user actions.

After resetting, all activity history is lost. The `activity_log` table will be empty.

## Post-Reset Checklist

After resetting your database, verify:

- [ ] Docker containers are running: `docker-compose ps`
- [ ] Database connection works: `php artisan db:show`
- [ ] Migrations are all applied: `php artisan migrate:status`
- [ ] Admin user exists and can login at `http://admin.virtualracingleagues.localhost`
- [ ] Test user exists and can login at `http://virtualracingleagues.localhost`
- [ ] Caches are cleared: `php artisan optimize:clear`
- [ ] Queue workers are running if needed: `php artisan queue:work`
- [ ] Media files are accessible: Check `storage/app/public/media/`

## Quick Reference Commands

```bash
# Most common reset scenarios:

# Fresh start with test data
php artisan migrate:fresh --seed

# Fresh start with backup data
php artisan migrate:fresh && php artisan db:seed && php artisan db:seed --class="Database\\Seeders\\Backup\\DatabaseBackupSeeder"

# Just re-seed (doesn't drop tables)
php artisan db:seed

# Rollback and re-run (without dropping)
php artisan migrate:refresh --seed

# Nuclear option (complete wipe)
php artisan db:wipe && php artisan migrate && php artisan db:seed

# Check migration status
php artisan migrate:status

# Check database info
php artisan db:show

# Access database directly
mysql -h mariadb -u laravel -psecret --skip-ssl virtualracingleagues
```

## Environment-Specific Considerations

### Local Development (`.env`: `APP_ENV=local`)

- All seeders run (production + development)
- Safe to reset database frequently
- No data loss concerns

### Testing Environment (`.env`: `APP_ENV=testing`)

- Uses separate test database: `virtualracingleagues_test`
- Tests should use `RefreshDatabase` trait
- Reset happens automatically during tests

### Production Environment (`.env`: `APP_ENV=production`)

**⚠️ WARNING: NEVER RESET PRODUCTION DATABASE ⚠️**

- Backup seeders won't run in production (safety feature)
- Always backup production data first: `mysqldump`
- Use migrations only: `php artisan migrate`
- Never use `migrate:fresh` or `db:wipe` in production

## Additional Resources

- **Backup Seeder Documentation**: `database/seeders/Backup/README.md`
- **Laravel Migration Docs**: https://laravel.com/docs/migrations
- **Laravel Seeding Docs**: https://laravel.com/docs/seeding
- **Docker Reference Guide**: `.claude/guides/docker/docker_reference_guide.md`

## Summary

For most development scenarios, use:
```bash
php artisan migrate:fresh --seed
```

This gives you a clean database with test data and takes ~10 seconds.

If you need your backed-up racing data, run the backup seeder afterward:
```bash
php artisan db:seed --class="Database\\Seeders\\Backup\\DatabaseBackupSeeder"
```

That's it! Your database is now reset and ready to use.

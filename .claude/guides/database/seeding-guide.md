# Database Migration & Seeding Guide

This guide covers database setup, seeding, and reset procedures for both local development and production environments.

## Overview

The application uses MariaDB 10.11 with Laravel's migration system. The database contains:

- **51 migrations** covering users, admins, leagues, competitions, seasons, races, and results
- **15 seeders** with separation between production-safe and development-only data
- **16 factories** for generating test data

## Prerequisites

### Local Development

Ensure Docker is running with all services:

```bash
docker-compose up -d
```

Verify the database container is healthy:

```bash
docker-compose ps mariadb
```

You should see `healthy` in the status.

### Production

- MariaDB 10.11+ or MySQL 8.0+ server accessible
- Database user with CREATE, ALTER, DROP, INSERT, UPDATE, DELETE privileges
- `.env` configured with production database credentials

---

## Local Development Setup

### 1. Copy Environment File

```bash
cp .env.example .env
```

The default database configuration:

```env
DB_CONNECTION=mysql
DB_HOST=mariadb
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=laravel
DB_PASSWORD=secret
```

### 2. Generate Application Key

```bash
php artisan key:generate
```

### 3. Run Migrations

Create all database tables:

```bash
php artisan migrate
```

### 4. Seed the Database

Run all seeders (production + development data):

```bash
php artisan db:seed
```

This creates:

| Data | Description |
|------|-------------|
| **Admins** | Super admin (`superadmin@virtualracingleagues.com`), admin, moderator |
| **Users** | Test user (`user@raceonoz.com`) |
| **Platforms** | GT7, iRacing, ACC, rFactor 2, AMS2, F1 24 |
| **Tracks** | All track locations and layouts per platform |
| **League** | "Race on Oz" test league |
| **Drivers** | Sample driver records |

**Default password for all accounts:** `password`

### 5. Access the Database

From inside the container:

```bash
mysql -h mariadb -u laravel -psecret --skip-ssl virtualracingleagues
```

From host machine (port 3307):

```bash
mysql -h 127.0.0.1 -P 3307 -u laravel -psecret laravel
```

---

## Production Setup

### 1. Configure Environment

Set production database credentials in `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=your-production-host.com
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_username
DB_PASSWORD=your_secure_password
```

### 2. Run Migrations

```bash
php artisan migrate --force
```

The `--force` flag is required in production environments.

### 3. Seed Production Data Only

Run only production-safe seeders:

```bash
php artisan db:seed --class=AdminSeeder --force
php artisan db:seed --class=PlatformSeeder --force
php artisan db:seed --class=PlatformTrackLocationSeeder --force
php artisan db:seed --class=PlatformTrackSeeder --force
php artisan db:seed --class=RoundTiebreakerRulesSeeder --force
```

Or run all seeders (the DatabaseSeeder checks environment and skips dev-only data):

```bash
php artisan db:seed --force
```

### 4. Production-Safe Seeders

These seeders are safe to run in production:

| Seeder | Description |
|--------|-------------|
| `AdminSeeder` | Creates super admin account |
| `PlatformSeeder` | Gaming platforms (GT7, iRacing, etc.) |
| `PlatformTrackLocationSeeder` | Track locations |
| `PlatformTrackSeeder` | Track layouts |
| `RoundTiebreakerRulesSeeder` | Tiebreaker rule definitions |

### 5. Development-Only Seeders

**Do NOT run in production:**

| Seeder | Description |
|--------|-------------|
| `UserSeeder` | Test user accounts |
| `LeagueSeeder` | Sample league |
| `DriverSeeder` | Sample drivers |
| `CompetitionSeeder` | Sample competitions |
| `SiteConfigSeeder` | Dev site settings |

---

## Resetting the Database

### Quick Reset Options

#### Option 1: Fresh Migration with Default Seeders (Recommended)

Drops all tables, re-runs migrations, and seeds with production + development data:

```bash
php artisan migrate:fresh --seed
```

**What this does:**
- Drops all tables in the database
- Re-runs all migrations
- Seeds production data (Admins, Platforms, Platform Tracks)
- Seeds development data (Site Config, Users, Leagues, Drivers, Competitions)

**Best for:** Starting fresh with clean test data

#### Option 2: Fresh Migration with Backup Seeders

Restores your backed-up racing data (seasons, rounds, races, results):

```bash
# Drop all tables and re-run migrations
php artisan migrate:fresh

# Run default seeders first (required for foreign key dependencies)
php artisan db:seed

# Then restore backup data
php artisan db:seed --class="Database\\Seeders\\Backup\\DatabaseBackupSeeder"
```

**Best for:** Restoring actual racing data after a reset

#### Option 3: Refresh Migrations (Rollback + Re-run)

Rolls back and re-runs migrations without dropping tables:

```bash
php artisan migrate:refresh --seed
```

**What this does:**
- Rolls back all migrations (uses `down()` methods)
- Re-runs all migrations (uses `up()` methods)
- Seeds the database

#### Option 4: Nuclear Option (Complete Wipe)

```bash
php artisan db:wipe && php artisan migrate && php artisan db:seed
```

### Manual Database Reset

If artisan commands are failing:

```bash
# Access MariaDB container
mysql -h mariadb -u laravel -psecret --skip-ssl

# Drop and recreate database
DROP DATABASE IF EXISTS virtualracingleagues;
CREATE DATABASE virtualracingleagues CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE virtualracingleagues;
exit;

# Run migrations and seed
php artisan migrate
php artisan db:seed
```

### Backup Seeders

Located at: `database/seeders/Backup/`

These seeders restore actual racing data:
- 6 seasons, 3 teams, 4 divisions
- 62 season drivers, 12 rounds, 19 races
- 697 race results

**Run all backup seeders:**

```bash
php artisan db:seed --class="Database\\Seeders\\Backup\\DatabaseBackupSeeder"
```

**Run individual backup seeders (must respect dependency order):**

```bash
php artisan db:seed --class="Database\\Seeders\\Backup\\SeasonsBackupSeeder"
php artisan db:seed --class="Database\\Seeders\\Backup\\TeamsBackupSeeder"
php artisan db:seed --class="Database\\Seeders\\Backup\\DivisionsBackupSeeder"
php artisan db:seed --class="Database\\Seeders\\Backup\\SeasonDriversBackupSeeder"
php artisan db:seed --class="Database\\Seeders\\Backup\\RoundsBackupSeeder"
php artisan db:seed --class="Database\\Seeders\\Backup\\RacesBackupSeeder"
php artisan db:seed --class="Database\\Seeders\\Backup\\RaceResultsBackupSeeder"
```

**Regenerate backup seeders from current database:**

```bash
php generate_backup_seeders.php
```

### Reset Specific Tables Only

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

### Post-Reset Checklist

After resetting your database, verify:

- [ ] Docker containers are running: `docker-compose ps`
- [ ] Database connection works: `php artisan db:show`
- [ ] Migrations are all applied: `php artisan migrate:status`
- [ ] Admin user can login at `http://admin.virtualracingleagues.localhost`
- [ ] Test user can login at `http://virtualracingleagues.localhost`
- [ ] Caches are cleared: `php artisan optimize:clear`

### Clear All Caches After Reset

```bash
php artisan optimize:clear
```

Or individually:

```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

---

## Common Commands

### Migrations

```bash
# Run pending migrations
php artisan migrate

# Rollback last batch
php artisan migrate:rollback

# Rollback specific steps
php artisan migrate:rollback --step=3

# Reset all migrations
php artisan migrate:reset

# Refresh (rollback all + migrate)
php artisan migrate:refresh

# Fresh (drop all tables + migrate)
php artisan migrate:fresh

# Check migration status
php artisan migrate:status
```

### Seeding

```bash
# Run all seeders
php artisan db:seed

# Run specific seeder
php artisan db:seed --class=PlatformSeeder

# Fresh migration with seeding
php artisan migrate:fresh --seed
```

### Creating New Migrations

```bash
# Create table
php artisan make:migration create_table_name

# Add column to existing table
php artisan make:migration add_column_to_table_name
```

### Creating New Seeders

```bash
php artisan make:seeder NewSeeder
```

Register in `database/seeders/DatabaseSeeder.php`:

```php
public function run(): void
{
    // Production seeders (always run)
    $this->call([
        AdminSeeder::class,
        PlatformSeeder::class,
        // Add production-safe seeders here
    ]);

    // Development seeders (local only)
    if (app()->environment('local')) {
        $this->call([
            UserSeeder::class,
            // Add dev-only seeders here
        ]);
    }
}
```

---

## Test Database

For running tests, a separate database is configured:

**Database name:** `virtualracingleagues_test`

The test connection is defined in `config/database.php`:

```php
'testing' => [
    'driver' => 'mariadb',
    'host' => env('DB_HOST', 'mariadb'),
    'database' => 'virtualracingleagues_test',
    // ...
]
```

Tests use `RefreshDatabase` trait to reset between tests.

```bash
# Create test database
mysql -h mariadb -u laravel -psecret --skip-ssl -e "CREATE DATABASE IF NOT EXISTS virtualracingleagues_test;"

# Run migrations on test database
php artisan migrate --database=testing

# Seed test database
php artisan db:seed --database=testing
```

---

## Troubleshooting

### Connection Refused

```
SQLSTATE[HY000] [2002] Connection refused
```

**Solution:** Ensure Docker containers are running:

```bash
docker-compose up -d
docker-compose ps
docker-compose logs mariadb
```

### Access Denied

```
SQLSTATE[HY000] [1045] Access denied
```

**Solution:** Verify `.env` credentials match Docker configuration.

### Migration Failed - Table Already Exists

```bash
php artisan migrate:fresh --seed
```

### Foreign Key Constraint Failures

When seeding, ensure seeders run in correct order. Use:

```bash
php artisan migrate:fresh --seed
```

For backup seeders, run default seeders first:

```bash
php artisan db:seed
php artisan db:seed --class="Database\\Seeders\\Backup\\DatabaseBackupSeeder"
```

### Seeder Class Not Found

```bash
composer dump-autoload
php artisan db:seed --class="Database\\Seeders\\Backup\\DatabaseBackupSeeder"
```

### Permission Denied

```bash
chmod -R 775 storage bootstrap/cache
chown -R laravel:laravel storage bootstrap/cache
```

### Out of Memory

```bash
php -d memory_limit=512M artisan migrate:fresh --seed
```

---

## Database Architecture Notes

### Session Storage

Sessions are stored in the database:

```env
SESSION_DRIVER=database
```

After resetting, all users will be logged out.

### Queue Storage

Queues are stored in the database:

```env
QUEUE_CONNECTION=database
```

After resetting, all pending queue jobs will be lost.

### Media Library

Media files are stored in `storage/app/public/media/`. After database reset:
- Media table records are deleted
- Physical files remain in storage

---

## Default Accounts

### Local Development

| Type | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@virtualracingleagues.com` | `password` |
| Admin | `admin@example.com` | `password` |
| Moderator | `moderator@example.com` | `password` |
| User | `user@raceonoz.com` | `password` |

### Production

Only the super admin is created:

| Type | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@virtualracingleagues.com` | `password` |

**Important:** Change the super admin password immediately after deployment.

---

## Quick Reference

```bash
# Fresh start with test data
php artisan migrate:fresh --seed

# Fresh start with backup data
php artisan migrate:fresh && php artisan db:seed && php artisan db:seed --class="Database\\Seeders\\Backup\\DatabaseBackupSeeder"

# Just re-seed (doesn't drop tables)
php artisan db:seed

# Rollback and re-run
php artisan migrate:refresh --seed

# Check status
php artisan migrate:status
php artisan db:show

# Access database
mysql -h mariadb -u laravel -psecret --skip-ssl virtualracingleagues
```

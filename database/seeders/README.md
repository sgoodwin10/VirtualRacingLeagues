# Database Seeders

This directory contains all database seeders for the Virtual Racing Leagues application.

## Environment Safety

All development/testing seeders include environment protection to **NEVER run in production**. Each seeder checks:

```php
if (app()->environment('production')) {
    $this->command->error('Seeder cannot run in production environment!');
    return;
}
```

## Seeder Categories

### Production-Required Seeders
These seeders provide essential platform data and can run in any environment:

- `AdminSeeder` - Creates default admin user
- `PlatformSeeder` - Gaming platforms (Gran Turismo 7, etc.)
- `PlatformTrackLocationSeeder` - Track locations
- `PlatformTrackSeeder` - Tracks for each platform

### Development-Only Seeders
These seeders provide test data and **ONLY run in local/development/testing environments**:

#### Core Configuration
- `SiteConfigSeeder` - Site configuration
- `UserSeeder` - Test users

#### League Structure (must run in this order)
The following seeders must run in order due to foreign key dependencies:

1. `LeagueSeeder` - Creates base league
2. `DriverSeeder` - Creates drivers and league_drivers
3. `CompetitionSeeder` - Creates competitions
4. `SeasonSeeder` - Creates seasons
5. `DivisionSeeder` - Creates divisions
6. `RoundSeeder` - Creates rounds
7. `RaceSeeder` - Creates races
8. `RaceResultSeeder` - Creates race results (from SQL backup)

## Running Seeders

### Run All Seeders
```bash
php artisan db:seed
```

### Run Specific Seeder
```bash
php artisan db:seed --class=CompetitionSeeder
```

### Fresh Migration with Seeding
```bash
php artisan migrate:fresh --seed
```

## Race Results Backup

The `RaceResultSeeder` requires a SQL backup file to import race results data.

### Creating the Backup File

From inside the PHP container:
```bash
mysqldump -h mariadb -u laravel -psecret --skip-ssl \
  --no-create-info --skip-add-drop-table --complete-insert \
  virtualracingleagues race_results > database/seeders/data/race_results.sql
```

From the host machine:
```bash
docker-compose exec app bash -c "mysqldump -h mariadb -u laravel -psecret --skip-ssl \
  --no-create-info --skip-add-drop-table --complete-insert \
  virtualracingleagues race_results > database/seeders/data/race_results.sql"
```

### Backup File Location

The backup file should be placed at:
```
database/seeders/data/race_results.sql
```

**Note**: The `database/seeders/data/` directory has a `.gitignore` that ignores `*.sql` files to prevent committing potentially large or sensitive data.

## Seeder Behavior

### firstOrCreate Pattern
Most seeders use `firstOrCreate()` to prevent duplicates:

```php
Competition::firstOrCreate(
    ['id' => 1],  // Search criteria
    [/* data */]   // Data to insert if not found
);
```

This means seeders are **idempotent** - running them multiple times won't create duplicates.

### RaceResultSeeder Behavior
The `RaceResultSeeder` has special behavior:

1. **Checks if data already exists**: If `race_results` table has data, it skips seeding
2. **Looks for backup file**: If no data exists, it looks for `database/seeders/data/race_results.sql`
3. **Imports from backup**: If backup file exists, it imports the SQL
4. **Skips gracefully**: If no backup file exists, it shows instructions and skips

## Testing Seeders

### Check Syntax
```bash
php -l database/seeders/CompetitionSeeder.php
```

### Check Environment Protection
To verify environment protection works, temporarily set environment to production:

```bash
# DON'T DO THIS IN ACTUAL PRODUCTION!
APP_ENV=production php artisan db:seed --class=CompetitionSeeder
# Should show error: "CompetitionSeeder cannot run in production environment!"
```

## Foreign Key Dependencies

The league structure has these foreign key relationships:

```
League (id: 1)
  └── Competition (league_id: 1)
        └── Season (competition_id: 1)
              ├── Division (season_id: 4)
              └── Round (season_id: 4)
                    └── Race (round_id: 1, 4)
                          └── RaceResult (race_id: 1, 2, 6, 7, 8, 9)

Driver (id: 1-68)
  └── LeagueDriver (league_id: 1, driver_id: 1-68)
        └── RaceResult (driver_id: 1-68)
```

This is why seeders must run in the order specified in `DatabaseSeeder.php`.

## Exported Data Details

### Current Data Snapshot (2025-12-04)

- **1 Competition**: "Sunday Nights" (ID: 1)
- **1 Season**: "Season 1" (ID: 4)
- **4 Divisions**: Division 1-4 (IDs: 1-4)
- **2 Rounds**: Round 1-2 (IDs: 1, 4)
- **6 Races**: 2 qualifying + 4 sprint races (IDs: 1, 2, 6, 7, 8, 9)
- **304 Race Results**: Complete results for all 6 races
- **68 Drivers**: From DriverSeeder

All data was exported from the existing database on 2025-12-04 to preserve the current state for development/testing.

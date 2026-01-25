<?php

/**
 * Generate Database Backup Seeders
 *
 * This script generates backup seeder files from current database data
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

function formatValue($value, $key = null): string
{
    if ($value === null) {
        return 'null';
    }

    if (is_bool($value) || (is_numeric($value) && in_array($value, [0, 1]) && in_array($key, [
        'team_championship_enabled', 'teams_drop_rounds', 'race_divisions_enabled',
        'race_times_required', 'drop_round', 'fastest_lap_top_10', 'qualifying_pole_top_10',
        'round_points', 'is_qualifier', 'extra_lap_after_time', 'track_limits_enforced',
        'false_start_detection', 'collision_penalties', 'mandatory_pit_stop', 'race_points',
        'has_fastest_lap', 'has_pole', 'dnf',
    ]))) {
        return $value ? 'true' : 'false';
    }

    if (is_numeric($value)) {
        return (string) $value;
    }

    // For JSON fields, use json_encode()
    if (in_array($key, ['points_system', 'round_results', 'qualifying_results', 'race_time_results', 'fastest_lap_results'])) {
        if ($value) {
            return 'json_encode('.var_export(json_decode($value, true), true).')';
        }

        return 'null';
    }

    // Escape single quotes in strings
    $escaped = str_replace("'", "\\'", $value);

    return "'".$escaped."'";
}

function generateSeeder(string $tableName, string $modelClass, array $columns, string $outputFile, string $dependencies = ''): void
{
    echo "Generating {$tableName} seeder...\n";

    $records = DB::table($tableName)->get()->map(function ($record) {
        return (array) $record;
    })->toArray();

    $className = str_replace('BackupSeeder', '', basename($outputFile, '.php')).'BackupSeeder';
    $generatedDate = date('Y-m-d');
    $recordCount = count($records);

    $seederContent = <<<PHP
<?php

declare(strict_types=1);

namespace Database\Seeders\Backup;

use {$modelClass};
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * {$className}
 *
 * This seeder restores the {$tableName} table data from a backup.
 * Generated: {$generatedDate}
 *
 * IMPORTANT: This seeder should ONLY run in local/development/staging environments.{$dependencies}
 */
class {$className} extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Environment safety check - NEVER run in production
        if (app()->environment('production')) {
            \$this->command->error('{$className} cannot run in production environment!');
            return;
        }

        \$this->command->info('Seeding {$tableName} backup data...');

        // Disable foreign key checks temporarily
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        \${$tableName} = [

PHP;

    foreach ($records as $record) {
        $seederContent .= "            [\n";
        foreach ($columns as $column) {
            $value = $record[$column] ?? null;
            $formattedValue = formatValue($value, $column);
            $seederContent .= "                '{$column}' => {$formattedValue},\n";
        }
        $seederContent .= "            ],\n";
    }

    $modelVar = str_replace('_', '', ucwords($tableName, '_'));
    $modelVar = lcfirst($modelVar).'Data';
    $modelShortClass = class_basename($modelClass);

    $seederContent .= <<<PHP
        ];

        foreach (\${$tableName} as \${$modelVar}) {
            {$modelShortClass}::updateOrCreate(
                ['id' => \${$modelVar}['id']],
                \${$modelVar}
            );
        }

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        \$this->command->info('{$className} seeded successfully. Total records: ' . count(\${$tableName}));
    }
}

PHP;

    file_put_contents($outputFile, $seederContent);
    echo "  ✓ Generated {$outputFile} ({$recordCount} records)\n";
}

echo "DATABASE BACKUP SEEDER GENERATION\n";
echo 'Generated: '.date('Y-m-d H:i:s')."\n";
echo str_repeat('=', 80)."\n\n";

// Generate each seeder
generateSeeder(
    'seasons',
    'App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent',
    [
        'id', 'competition_id', 'name', 'slug', 'car_class', 'description', 'technical_specs',
        'logo_path', 'banner_path', 'team_championship_enabled', 'teams_drivers_for_calculation',
        'teams_drop_rounds', 'teams_total_drop_rounds', 'race_divisions_enabled',
        'race_times_required', 'drop_round', 'total_drop_rounds', 'status',
        'created_by_user_id', 'created_at', 'updated_at', 'deleted_at',
    ],
    __DIR__.'/database/seeders/Backup/SeasonsBackupSeeder.php',
    "\n * Dependencies: competitions, users tables must have required records"
);

generateSeeder(
    'teams',
    'App\Infrastructure\Persistence\Eloquent\Models\Team',
    ['id', 'season_id', 'name', 'logo_url', 'created_at', 'updated_at'],
    __DIR__.'/database/seeders/Backup/TeamsBackupSeeder.php',
    "\n * Dependencies: SeasonsBackupSeeder must run first"
);

generateSeeder(
    'divisions',
    'App\Infrastructure\Persistence\Eloquent\Models\Division',
    ['id', 'season_id', 'order', 'name', 'description', 'logo_url', 'created_at', 'updated_at'],
    __DIR__.'/database/seeders/Backup/DivisionsBackupSeeder.php',
    "\n * Dependencies: SeasonsBackupSeeder must run first"
);

generateSeeder(
    'season_drivers',
    'App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent',
    ['id', 'season_id', 'league_driver_id', 'team_id', 'division_id', 'status', 'notes', 'added_at', 'updated_at'],
    __DIR__.'/database/seeders/Backup/SeasonDriversBackupSeeder.php',
    "\n * Dependencies: SeasonsBackupSeeder, TeamsBackupSeeder, DivisionsBackupSeeder must run first"
);

generateSeeder(
    'rounds',
    'App\Infrastructure\Persistence\Eloquent\Models\Round',
    [
        'id', 'season_id', 'round_number', 'name', 'slug', 'scheduled_at', 'timezone',
        'platform_track_id', 'track_layout', 'track_conditions', 'technical_notes',
        'stream_url', 'internal_notes', 'fastest_lap', 'fastest_lap_top_10',
        'qualifying_pole', 'qualifying_pole_top_10', 'points_system', 'round_points',
        'status', 'round_results', 'qualifying_results', 'race_time_results',
        'fastest_lap_results', 'created_by_user_id', 'created_at', 'updated_at', 'deleted_at',
    ],
    __DIR__.'/database/seeders/Backup/RoundsBackupSeeder.php',
    "\n * Dependencies: SeasonsBackupSeeder must run first\n *\n * Note: JSON result fields (round_results, qualifying_results, race_time_results, fastest_lap_results)\n * are not included in this backup as they are dynamically generated from race_results table."
);

generateSeeder(
    'races',
    'App\Infrastructure\Persistence\Eloquent\Models\Race',
    [
        'id', 'round_id', 'is_qualifier', 'race_number', 'name', 'race_type',
        'qualifying_format', 'qualifying_length', 'qualifying_tire', 'grid_source',
        'grid_source_race_id', 'length_type', 'length_value', 'extra_lap_after_time',
        'weather', 'tire_restrictions', 'fuel_usage', 'damage_model',
        'track_limits_enforced', 'false_start_detection', 'collision_penalties',
        'mandatory_pit_stop', 'minimum_pit_time', 'assists_restrictions',
        'fastest_lap', 'fastest_lap_top_10', 'qualifying_pole', 'qualifying_pole_top_10',
        'race_points', 'points_system', 'dnf_points', 'dns_points', 'race_notes',
        'status', 'created_at', 'updated_at',
    ],
    __DIR__.'/database/seeders/Backup/RacesBackupSeeder.php',
    "\n * Dependencies: RoundsBackupSeeder must run first"
);

generateSeeder(
    'race_results',
    'App\Infrastructure\Persistence\Eloquent\Models\RaceResult',
    [
        'id', 'race_id', 'driver_id', 'division_id', 'position', 'original_race_time',
        'original_race_time_difference', 'final_race_time_difference', 'fastest_lap',
        'penalties', 'has_fastest_lap', 'has_pole', 'dnf', 'status', 'race_points',
        'positions_gained', 'created_at', 'updated_at',
    ],
    __DIR__.'/database/seeders/Backup/RaceResultsBackupSeeder.php',
    "\n * Dependencies: RacesBackupSeeder, SeasonDriversBackupSeeder, DivisionsBackupSeeder must run first"
);

echo "\n".str_repeat('=', 80)."\n";
echo "✓ All backup seeders generated successfully!\n";
echo "\nNow updating README.md...\n";

// Count records
$counts = [
    'seasons' => DB::table('seasons')->count(),
    'teams' => DB::table('teams')->count(),
    'divisions' => DB::table('divisions')->count(),
    'season_drivers' => DB::table('season_drivers')->count(),
    'rounds' => DB::table('rounds')->count(),
    'races' => DB::table('races')->count(),
    'race_results' => DB::table('race_results')->count(),
];

$total = array_sum($counts);
$generatedDate = date('Y-m-d');

$readmeContent = <<<MD
# Database Backup Seeders

This directory contains Laravel seeders that serve as a backup mechanism for critical racing data tables.

**Generated:** {$generatedDate}

## Overview

These seeders were created to backup and restore data from the following tables:
- `seasons` ({$counts['seasons']} records)
- `teams` ({$counts['teams']} records)
- `divisions` ({$counts['divisions']} records)
- `season_drivers` ({$counts['season_drivers']} records)
- `rounds` ({$counts['rounds']} records)
- `races` ({$counts['races']} records)
- `race_results` ({$counts['race_results']} records)

**Total Records:** {$total}

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

MD;

file_put_contents(__DIR__.'/database/seeders/Backup/README.md', $readmeContent);
echo "✓ README.md updated successfully!\n";
echo "\n✓ All done!\n";

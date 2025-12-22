<?php

declare(strict_types=1);

namespace Database\Seeders\Backup;

use Illuminate\Database\Seeder;

/**
 * Database Backup Master Seeder
 *
 * This master seeder orchestrates the restoration of all backup data in the correct order
 * to respect foreign key dependencies.
 *
 * Generated: 2025-12-22
 *
 * IMPORTANT: This seeder should ONLY run in local/development/staging environments.
 *
 * Dependency Order:
 * 1. Seasons (depends on: competitions, users - assumed to exist)
 * 2. Teams (depends on: seasons)
 * 3. Divisions (depends on: seasons)
 * 4. Season Drivers (depends on: seasons, league_drivers, teams, divisions)
 * 5. Rounds (depends on: seasons, platform_tracks, users)
 * 6. Races (depends on: rounds, races for grid_source_race_id)
 * 7. Race Results (depends on: races, season_drivers, divisions)
 *
 * Usage:
 *   php artisan db:seed --class="Database\Seeders\Backup\DatabaseBackupSeeder"
 */
class DatabaseBackupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Environment safety check - NEVER run in production
        if (app()->environment('production')) {
            $this->command->error('DatabaseBackupSeeder cannot run in production environment!');
            $this->command->error('This would overwrite production data!');
            return;
        }

        $this->command->warn('========================================');
        $this->command->warn('DATABASE BACKUP RESTORATION');
        $this->command->warn('========================================');
        $this->command->info('This will restore backup data for the following tables:');
        $this->command->info('  - seasons');
        $this->command->info('  - teams');
        $this->command->info('  - divisions');
        $this->command->info('  - season_drivers');
        $this->command->info('  - rounds');
        $this->command->info('  - races');
        $this->command->info('  - race_results');
        $this->command->warn('========================================');
        $this->command->newLine();

        // 1. Restore Seasons
        $this->command->info('Step 1/7: Restoring seasons...');
        $this->call(SeasonsBackupSeeder::class);
        $this->command->newLine();

        // 2. Restore Teams
        $this->command->info('Step 2/7: Restoring teams...');
        $this->call(TeamsBackupSeeder::class);
        $this->command->newLine();

        // 3. Restore Divisions
        $this->command->info('Step 3/7: Restoring divisions...');
        $this->call(DivisionsBackupSeeder::class);
        $this->command->newLine();

        // 4. Restore Season Drivers
        $this->command->info('Step 4/7: Restoring season drivers...');
        $this->call(SeasonDriversBackupSeeder::class);
        $this->command->newLine();

        // 5. Restore Rounds
        $this->command->info('Step 5/7: Restoring rounds...');
        $this->call(RoundsBackupSeeder::class);
        $this->command->newLine();

        // 6. Restore Races
        $this->command->info('Step 6/7: Restoring races...');
        $this->call(RacesBackupSeeder::class);
        $this->command->newLine();

        // 7. Restore Race Results
        $this->command->info('Step 7/7: Restoring race results...');
        $this->call(RaceResultsBackupSeeder::class);
        $this->command->newLine();

        $this->command->warn('========================================');
        $this->command->info('DATABASE BACKUP RESTORATION COMPLETE!');
        $this->command->warn('========================================');
        $this->command->info('All backup data has been successfully restored.');
        $this->command->newLine();
    }
}

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
 * Generated: 2026-02-06
 *
 * IMPORTANT: This seeder should ONLY run in local/development/staging environments.
 *
 * NOTE: This backup is filtered to include only data for users 1 and 3 and their associated
 * leagues, competitions, and racing data.
 *
 * Dependency Order:
 * 1. Users (no dependencies - must run first)
 * 2. Leagues (depends on: users)
 * 3. Drivers (no dependencies)
 * 4. League Drivers (depends on: leagues, drivers)
 * 5. Competitions (depends on: leagues, platforms)
 * 6. Seasons (depends on: competitions, users)
 * 7. Teams (depends on: seasons)
 * 8. Divisions (depends on: seasons)
 * 9. Season Drivers (depends on: seasons, league_drivers, teams, divisions)
 * 10. Rounds (depends on: seasons, platform_tracks, users)
 * 11. Races (depends on: rounds, races for grid_source_race_id)
 * 12. Race Results (depends on: races, season_drivers, divisions)
 *
 * Prerequisites:
 * - PlatformSeeder must have been run (platforms table populated)
 * - Platform tracks must exist
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
        $this->command->info('  - users (filtered: IDs 1 and 3)');
        $this->command->info('  - leagues');
        $this->command->info('  - drivers');
        $this->command->info('  - league_drivers');
        $this->command->info('  - competitions');
        $this->command->info('  - seasons');
        $this->command->info('  - teams');
        $this->command->info('  - divisions');
        $this->command->info('  - season_drivers');
        $this->command->info('  - rounds');
        $this->command->info('  - races');
        $this->command->info('  - race_results');
        $this->command->warn('========================================');
        $this->command->newLine();

        // 1. Restore Users
        $this->command->info('Step 1/12: Restoring users...');
        $this->call(UsersBackupSeeder::class);
        $this->command->newLine();

        // 2. Restore Leagues
        $this->command->info('Step 2/12: Restoring leagues...');
        $this->call(LeaguesBackupSeeder::class);
        $this->command->newLine();

        // 3. Restore Drivers
        $this->command->info('Step 3/12: Restoring drivers...');
        $this->call(DriversBackupSeeder::class);
        $this->command->newLine();

        // 4. Restore League Drivers
        $this->command->info('Step 4/12: Restoring league drivers...');
        $this->call(LeagueDriversBackupSeeder::class);
        $this->command->newLine();

        // 5. Restore Competitions
        $this->command->info('Step 5/12: Restoring competitions...');
        $this->call(CompetitionsBackupSeeder::class);
        $this->command->newLine();

        // 6. Restore Seasons
        $this->command->info('Step 6/12: Restoring seasons...');
        $this->call(SeasonsBackupSeeder::class);
        $this->command->newLine();

        // 7. Restore Teams
        $this->command->info('Step 7/12: Restoring teams...');
        $this->call(TeamsBackupSeeder::class);
        $this->command->newLine();

        // 8. Restore Divisions
        $this->command->info('Step 8/12: Restoring divisions...');
        $this->call(DivisionsBackupSeeder::class);
        $this->command->newLine();

        // 9. Restore Season Drivers
        $this->command->info('Step 9/12: Restoring season drivers...');
        $this->call(SeasonDriversBackupSeeder::class);
        $this->command->newLine();

        // 10. Restore Rounds
        $this->command->info('Step 10/12: Restoring rounds...');
        $this->call(RoundsBackupSeeder::class);
        $this->command->newLine();

        // 11. Restore Races
        $this->command->info('Step 11/12: Restoring races...');
        $this->call(RacesBackupSeeder::class);
        $this->command->newLine();

        // 12. Restore Race Results
        $this->command->info('Step 12/12: Restoring race results...');
        $this->call(RaceResultsBackupSeeder::class);
        $this->command->newLine();

        $this->command->warn('========================================');
        $this->command->info('DATABASE BACKUP RESTORATION COMPLETE!');
        $this->command->warn('========================================');
        $this->command->info('All backup data has been successfully restored.');
        $this->command->newLine();
    }
}

<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class RaceResultSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * IMPORTANT: This seeder should ONLY run in local/development/staging environments.
     *
     * This seeder requires a backup SQL file to import race results data.
     * To create the backup file, run:
     *   mysqldump -u laravel -p virtualracingleagues race_results > database/seeders/data/race_results.sql
     *
     * Alternatively, if the race_results table already has data, this seeder will skip.
     */
    public function run(): void
    {
        // Environment safety check - NEVER run in production
        if (app()->environment('production')) {
            $this->command->error('RaceResultSeeder cannot run in production environment!');
            return;
        }

        // Check if race_results table already has data
        $existingCount = DB::table('race_results')->count();

        if ($existingCount > 0) {
            $this->command->info("Race results table already contains {$existingCount} records. Skipping seeding.");
            return;
        }

        // Check if backup SQL file exists
        $backupFile = database_path('seeders/data/race_results.sql');

        if (File::exists($backupFile)) {
            $this->command->info('Importing race results from backup file...');

            // Import the SQL file
            $sql = File::get($backupFile);

            // Execute the SQL (this is safe because it's from a controlled file)
            DB::unprepared($sql);

            $newCount = DB::table('race_results')->count();
            $this->command->info("Successfully imported {$newCount} race results.");
        } else {
            $this->command->warn('No race results backup file found at: ' . $backupFile);
            $this->command->warn('To create a backup file, run:');
            $this->command->warn('  mysqldump -h mariadb -u laravel -psecret --skip-ssl virtualracingleagues race_results > database/seeders/data/race_results.sql');
            $this->command->info('Skipping race results seeding.');
        }
    }
}

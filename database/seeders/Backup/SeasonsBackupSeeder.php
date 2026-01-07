<?php

declare(strict_types=1);

namespace Database\Seeders\Backup;

use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * SeasonsBackupSeeder
 *
 * This seeder restores the seasons table data from a backup.
 * Generated: 2026-01-07
 *
 * IMPORTANT: This seeder should ONLY run in local/development/staging environments.
 * Dependencies: competitions, users tables must have required records
 */
class SeasonsBackupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Environment safety check - NEVER run in production
        if (app()->environment('production')) {
            $this->command->error('SeasonsBackupSeeder cannot run in production environment!');
            return;
        }

        $this->command->info('Seeding seasons backup data...');

        // Disable foreign key checks temporarily
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        $seasons = [
            [
                'id' => 4,
                'competition_id' => 1,
                'name' => 'Season 15',
                'slug' => 'season-15',
                'car_class' => null,
                'description' => null,
                'technical_specs' => null,
                'logo_path' => null,
                'banner_path' => null,
                'team_championship_enabled' => true,
                'teams_drivers_for_calculation' => 6,
                'teams_drop_rounds' => true,
                'teams_total_drop_rounds' => 1,
                'race_divisions_enabled' => true,
                'race_times_required' => true,
                'drop_round' => true,
                'total_drop_rounds' => 1,
                'status' => 'active',
                'created_by_user_id' => 1,
                'created_at' => '2025-11-27 11:32:10',
                'updated_at' => '2026-01-07 01:50:05',
                'deleted_at' => null,
            ]
        ];

        foreach ($seasons as $seasonsData) {
            SeasonEloquent::updateOrCreate(
                ['id' => $seasonsData['id']],
                $seasonsData
            );
        }

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info('SeasonsBackupSeeder seeded successfully. Total records: ' . count($seasons));
    }
}

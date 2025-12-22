<?php

declare(strict_types=1);

namespace Database\Seeders\Backup;

use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seasons Backup Seeder
 *
 * This seeder restores the seasons table data from a backup.
 * Generated: 2025-12-22
 *
 * IMPORTANT: This seeder should ONLY run in local/development/staging environments.
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
                'name' => 'Season 1',
                'slug' => 'season-1',
                'car_class' => null,
                'description' => null,
                'technical_specs' => null,
                'logo_path' => null,
                'banner_path' => null,
                'team_championship_enabled' => true,
                'teams_drivers_for_calculation' => null,
                'teams_drop_rounds' => false,
                'teams_total_drop_rounds' => null,
                'race_divisions_enabled' => true,
                'race_times_required' => true,
                'drop_round' => false,
                'total_drop_rounds' => 0,
                'status' => 'active',
                'created_by_user_id' => 1,
                'created_at' => '2025-11-27 11:32:10',
                'updated_at' => '2025-12-01 13:12:41',
                'deleted_at' => null,
            ],
        ];

        foreach ($seasons as $seasonData) {
            SeasonEloquent::updateOrCreate(
                ['id' => $seasonData['id']],
                $seasonData
            );
        }

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info('Seasons backup seeded successfully. Total records: ' . count($seasons));
    }
}

<?php

declare(strict_types=1);

namespace Database\Seeders\Backup;

use App\Infrastructure\Persistence\Eloquent\Models\Team;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * TeamsBackupSeeder
 *
 * This seeder restores the teams table data from a backup.
 * Generated: 2026-01-07
 *
 * IMPORTANT: This seeder should ONLY run in local/development/staging environments.
 * Dependencies: SeasonsBackupSeeder must run first
 */
class TeamsBackupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Environment safety check - NEVER run in production
        if (app()->environment('production')) {
            $this->command->error('TeamsBackupSeeder cannot run in production environment!');

            return;
        }

        $this->command->info('Seeding teams backup data...');

        // Disable foreign key checks temporarily
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        $teams = [
            [
                'id' => 1,
                'season_id' => 4,
                'name' => 'Gamesman',
                'logo_url' => 'teams/logos/to56kHEFaTrRl7fsQyVgygfVZZ0i5AkTLiVyygZv.jpg',
                'created_at' => '2025-12-22 04:36:07',
                'updated_at' => '2025-12-22 04:36:07',
            ],
            [
                'id' => 2,
                'season_id' => 4,
                'name' => 'Selby',
                'logo_url' => 'teams/logos/MbQZvD2YYJkA1yKG4iIz5j5Ul7ByLbDh2N7vbo9X.jpg',
                'created_at' => '2025-12-22 04:36:22',
                'updated_at' => '2025-12-22 04:36:22',
            ],
            [
                'id' => 3,
                'season_id' => 4,
                'name' => 'Bruce Hale',
                'logo_url' => 'teams/logos/LlWmmgn6LOO0uzCOATWWhU9JdtWULkt7a1qdkfR7.png',
                'created_at' => '2025-12-22 04:36:36',
                'updated_at' => '2025-12-22 04:36:36',
            ],
        ];

        foreach ($teams as $teamsData) {
            Team::updateOrCreate(
                ['id' => $teamsData['id']],
                $teamsData
            );
        }

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info('TeamsBackupSeeder seeded successfully. Total records: ' . count($teams));
    }
}

<?php

declare(strict_types=1);

namespace Database\Seeders\Backup;

use App\Infrastructure\Persistence\Eloquent\Models\Division;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Divisions Backup Seeder
 *
 * This seeder restores the divisions table data from a backup.
 * Generated: 2025-12-22
 *
 * IMPORTANT: This seeder should ONLY run in local/development/staging environments.
 * Dependencies: SeasonsBackupSeeder must run first
 */
class DivisionsBackupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Environment safety check - NEVER run in production
        if (app()->environment('production')) {
            $this->command->error('DivisionsBackupSeeder cannot run in production environment!');
            return;
        }

        $this->command->info('Seeding divisions backup data...');

        // Disable foreign key checks temporarily
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        $divisions = [
            [
                'id' => 1,
                'season_id' => 4,
                'order' => 1,
                'name' => 'Division 1',
                'description' => null,
                'logo_url' => null,
                'created_at' => '2025-12-21 11:35:37',
                'updated_at' => '2025-12-21 11:35:37',
            ],
            [
                'id' => 2,
                'season_id' => 4,
                'order' => 2,
                'name' => 'Division 2',
                'description' => null,
                'logo_url' => null,
                'created_at' => '2025-12-21 11:35:37',
                'updated_at' => '2025-12-21 11:35:37',
            ],
            [
                'id' => 3,
                'season_id' => 4,
                'order' => 3,
                'name' => 'Division 3',
                'description' => null,
                'logo_url' => null,
                'created_at' => '2025-12-21 11:35:37',
                'updated_at' => '2025-12-21 11:35:37',
            ],
            [
                'id' => 4,
                'season_id' => 4,
                'order' => 4,
                'name' => 'Division 4',
                'description' => null,
                'logo_url' => null,
                'created_at' => '2025-12-21 11:35:37',
                'updated_at' => '2025-12-21 11:35:37',
            ],
        ];

        foreach ($divisions as $divisionData) {
            Division::updateOrCreate(
                ['id' => $divisionData['id']],
                $divisionData
            );
        }

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info('Divisions backup seeded successfully. Total records: ' . count($divisions));
    }
}

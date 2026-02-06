<?php

declare(strict_types=1);

namespace Database\Seeders\Backup;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * CompetitionsBackupSeeder
 *
 * This seeder restores the competitions table data from a backup.
 * Generated: 2026-02-06
 *
 * IMPORTANT: This seeder should ONLY run in local/development/staging environments.
 * Dependencies: LeaguesBackupSeeder, PlatformSeeder must run first
 */
class CompetitionsBackupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Environment safety check - NEVER run in production
        if (app()->environment('production')) {
            $this->command->error('CompetitionsBackupSeeder cannot run in production environment!');
            return;
        }

        $this->command->info('Seeding competitions backup data...');

        // Disable foreign key checks temporarily
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        $competitions = [
            [
                'id' => 1,
                'league_id' => 1,
                'platform_id' => 1,
                'created_by_user_id' => 1,
                'name' => 'Sunday Nights',
                'slug' => 'sunday-nights',
                'description' => null,
                'logo_path' => null,
                'competition_colour' => '{"r":188,"g":67,"b":186}',
                'status' => 'active',
                'archived_at' => null,
                'created_at' => '2025-11-27 11:25:50',
                'updated_at' => '2025-11-27 11:25:50',
            ],
        ];

        foreach ($competitions as $competitionsData) {
            Competition::updateOrCreate(
                ['id' => $competitionsData['id']],
                $competitionsData
            );
        }

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info('CompetitionsBackupSeeder seeded successfully. Total records: ' . count($competitions));
    }
}

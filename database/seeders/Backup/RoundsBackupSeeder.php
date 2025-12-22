<?php

declare(strict_types=1);

namespace Database\Seeders\Backup;

use App\Infrastructure\Persistence\Eloquent\Models\Round;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Rounds Backup Seeder
 *
 * This seeder restores the rounds table data from a backup.
 * Generated: 2025-12-22
 *
 * IMPORTANT: This seeder should ONLY run in local/development/staging environments.
 * Dependencies: SeasonsBackupSeeder must run first
 *
 * Note: JSON result fields (round_results, qualifying_results, race_time_results, fastest_lap_results)
 * are not included in this backup as they are dynamically generated from race_results table.
 */
class RoundsBackupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Environment safety check - NEVER run in production
        if (app()->environment('production')) {
            $this->command->error('RoundsBackupSeeder cannot run in production environment!');
            return;
        }

        $this->command->info('Seeding rounds backup data...');

        // Disable foreign key checks temporarily
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        $rounds = [
            [
                'id' => 1,
                'season_id' => 4,
                'round_number' => 1,
                'name' => null,
                'slug' => 'round-1',
                'scheduled_at' => '2025-10-26 10:00:00',
                'timezone' => 'UTC',
                'platform_track_id' => 69,
                'track_layout' => null,
                'track_conditions' => null,
                'technical_notes' => null,
                'stream_url' => null,
                'internal_notes' => null,
                'fastest_lap' => 1,
                'fastest_lap_top_10' => false,
                'qualifying_pole' => 1,
                'qualifying_pole_top_10' => false,
                'points_system' => json_encode([
                    '1' => 25, '2' => 20, '3' => 16, '4' => 13, '5' => 11, '6' => 10,
                    '7' => 9, '8' => 8, '9' => 7, '10' => 6, '11' => 5, '12' => 4,
                    '13' => 3, '14' => 2, '15' => 1, '16' => 0,
                ]),
                'round_points' => true,
                'status' => 'completed',
                'round_results' => null, // Dynamically generated
                'qualifying_results' => null, // Dynamically generated
                'race_time_results' => null, // Dynamically generated
                'fastest_lap_results' => null, // Dynamically generated
                'created_by_user_id' => 1,
                'created_at' => '2025-11-27 11:25:50',
                'updated_at' => '2025-12-22 05:19:31',
                'deleted_at' => null,
            ],
            [
                'id' => 4,
                'season_id' => 4,
                'round_number' => 2,
                'name' => null,
                'slug' => 'round-2',
                'scheduled_at' => '2025-11-02 11:00:00',
                'timezone' => 'UTC',
                'platform_track_id' => 89,
                'track_layout' => null,
                'track_conditions' => null,
                'technical_notes' => null,
                'stream_url' => null,
                'internal_notes' => null,
                'fastest_lap' => 1,
                'fastest_lap_top_10' => false,
                'qualifying_pole' => 1,
                'qualifying_pole_top_10' => false,
                'points_system' => json_encode([
                    '1' => 25, '2' => 20, '3' => 16, '4' => 13, '5' => 11, '6' => 10,
                    '7' => 9, '8' => 8, '9' => 7, '10' => 6, '11' => 5, '12' => 4,
                    '13' => 3, '14' => 2, '15' => 1, '16' => 0,
                ]),
                'round_points' => true,
                'status' => 'scheduled',
                'round_results' => null,
                'qualifying_results' => null,
                'race_time_results' => null,
                'fastest_lap_results' => null,
                'created_by_user_id' => 1,
                'created_at' => '2025-11-27 11:25:50',
                'updated_at' => '2025-12-22 00:00:41',
                'deleted_at' => null,
            ],
            [
                'id' => 5,
                'season_id' => 4,
                'round_number' => 3,
                'name' => null,
                'slug' => 'round-3',
                'scheduled_at' => '2025-11-09 11:00:00',
                'timezone' => 'Australia/Sydney',
                'platform_track_id' => 116,
                'track_layout' => null,
                'track_conditions' => null,
                'technical_notes' => null,
                'stream_url' => null,
                'internal_notes' => null,
                'fastest_lap' => 1,
                'fastest_lap_top_10' => false,
                'qualifying_pole' => 1,
                'qualifying_pole_top_10' => false,
                'points_system' => json_encode([
                    '1' => 25, '2' => 20, '3' => 16, '4' => 13, '5' => 11, '6' => 10,
                    '7' => 9, '8' => 8, '9' => 7, '10' => 6, '11' => 5, '12' => 4,
                    '13' => 3, '14' => 2, '15' => 1, '16' => 0,
                ]),
                'round_points' => true,
                'status' => 'scheduled',
                'round_results' => null,
                'qualifying_results' => null,
                'race_time_results' => null,
                'fastest_lap_results' => null,
                'created_by_user_id' => 4,
                'created_at' => '2025-12-22 00:01:06',
                'updated_at' => '2025-12-22 00:01:06',
                'deleted_at' => null,
            ],
            [
                'id' => 6,
                'season_id' => 4,
                'round_number' => 4,
                'name' => null,
                'slug' => 'round-4',
                'scheduled_at' => '2025-11-16 11:01:00',
                'timezone' => 'Australia/Sydney',
                'platform_track_id' => 5,
                'track_layout' => null,
                'track_conditions' => null,
                'technical_notes' => null,
                'stream_url' => null,
                'internal_notes' => null,
                'fastest_lap' => 1,
                'fastest_lap_top_10' => false,
                'qualifying_pole' => 1,
                'qualifying_pole_top_10' => false,
                'points_system' => json_encode([
                    '1' => 25, '2' => 20, '3' => 16, '4' => 13, '5' => 11, '6' => 10,
                    '7' => 9, '8' => 8, '9' => 7, '10' => 6, '11' => 5, '12' => 4,
                    '13' => 3, '14' => 2, '15' => 1, '16' => 0,
                ]),
                'round_points' => true,
                'status' => 'scheduled',
                'round_results' => null,
                'qualifying_results' => null,
                'race_time_results' => null,
                'fastest_lap_results' => null,
                'created_by_user_id' => 4,
                'created_at' => '2025-12-22 00:01:24',
                'updated_at' => '2025-12-22 00:01:24',
                'deleted_at' => null,
            ],
            [
                'id' => 7,
                'season_id' => 4,
                'round_number' => 5,
                'name' => null,
                'slug' => 'round-5',
                'scheduled_at' => '2025-11-23 11:01:00',
                'timezone' => 'Australia/Sydney',
                'platform_track_id' => 3,
                'track_layout' => null,
                'track_conditions' => null,
                'technical_notes' => null,
                'stream_url' => null,
                'internal_notes' => null,
                'fastest_lap' => 1,
                'fastest_lap_top_10' => false,
                'qualifying_pole' => 1,
                'qualifying_pole_top_10' => false,
                'points_system' => json_encode([
                    '1' => 25, '2' => 20, '3' => 16, '4' => 13, '5' => 11, '6' => 10,
                    '7' => 9, '8' => 8, '9' => 7, '10' => 6, '11' => 5, '12' => 4,
                    '13' => 3, '14' => 2, '15' => 1, '16' => 0,
                ]),
                'round_points' => true,
                'status' => 'scheduled',
                'round_results' => null,
                'qualifying_results' => null,
                'race_time_results' => null,
                'fastest_lap_results' => null,
                'created_by_user_id' => 4,
                'created_at' => '2025-12-22 00:01:41',
                'updated_at' => '2025-12-22 00:01:41',
                'deleted_at' => null,
            ],
            [
                'id' => 8,
                'season_id' => 4,
                'round_number' => 6,
                'name' => null,
                'slug' => 'round-6',
                'scheduled_at' => '2025-11-30 11:01:00',
                'timezone' => 'Australia/Sydney',
                'platform_track_id' => 110,
                'track_layout' => null,
                'track_conditions' => null,
                'technical_notes' => null,
                'stream_url' => null,
                'internal_notes' => null,
                'fastest_lap' => 1,
                'fastest_lap_top_10' => false,
                'qualifying_pole' => 1,
                'qualifying_pole_top_10' => false,
                'points_system' => json_encode([
                    '1' => 25, '2' => 20, '3' => 16, '4' => 13, '5' => 11, '6' => 10,
                    '7' => 9, '8' => 8, '9' => 7, '10' => 6, '11' => 5, '12' => 4,
                    '13' => 3, '14' => 2, '15' => 1, '16' => 0,
                ]),
                'round_points' => true,
                'status' => 'scheduled',
                'round_results' => null,
                'qualifying_results' => null,
                'race_time_results' => null,
                'fastest_lap_results' => null,
                'created_by_user_id' => 4,
                'created_at' => '2025-12-22 00:01:59',
                'updated_at' => '2025-12-22 00:01:59',
                'deleted_at' => null,
            ],
            [
                'id' => 9,
                'season_id' => 4,
                'round_number' => 7,
                'name' => null,
                'slug' => 'round-7',
                'scheduled_at' => '2025-12-07 11:02:00',
                'timezone' => 'Australia/Sydney',
                'platform_track_id' => 81,
                'track_layout' => null,
                'track_conditions' => null,
                'technical_notes' => null,
                'stream_url' => null,
                'internal_notes' => null,
                'fastest_lap' => 1,
                'fastest_lap_top_10' => false,
                'qualifying_pole' => 1,
                'qualifying_pole_top_10' => false,
                'points_system' => json_encode([
                    '1' => 25, '2' => 20, '3' => 16, '4' => 13, '5' => 11, '6' => 10,
                    '7' => 9, '8' => 8, '9' => 7, '10' => 6, '11' => 5, '12' => 4,
                    '13' => 3, '14' => 2, '15' => 1, '16' => 0,
                ]),
                'round_points' => true,
                'status' => 'scheduled',
                'round_results' => null,
                'qualifying_results' => null,
                'race_time_results' => null,
                'fastest_lap_results' => null,
                'created_by_user_id' => 4,
                'created_at' => '2025-12-22 00:02:26',
                'updated_at' => '2025-12-22 00:02:26',
                'deleted_at' => null,
            ],
        ];

        foreach ($rounds as $roundData) {
            Round::updateOrCreate(
                ['id' => $roundData['id']],
                $roundData
            );
        }

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info('Rounds backup seeded successfully. Total records: ' . count($rounds));
    }
}

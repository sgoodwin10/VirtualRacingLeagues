<?php

declare(strict_types=1);

namespace Database\Seeders\Backup;

use App\Infrastructure\Persistence\Eloquent\Models\Race;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Races Backup Seeder
 *
 * This seeder restores the races table data from a backup.
 * Generated: 2025-12-22
 *
 * IMPORTANT: This seeder should ONLY run in local/development/staging environments.
 * Dependencies: RoundsBackupSeeder must run first
 */
class RacesBackupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * IMPORTANT: This seeder should ONLY run in local/development/staging environments.
     */
    public function run(): void
    {
        // Environment safety check - NEVER run in production
        if (app()->environment('production')) {
            $this->command->error('RacesBackupSeeder cannot run in production environment!');
            return;
        }

        $this->command->info('Seeding races backup data...');

        // Disable foreign key checks temporarily
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        $races = [
            // Round 1 Races
            [
                'id' => 1,
                'round_id' => 1,
                'is_qualifier' => true,
                'race_number' => null,
                'name' => null,
                'race_type' => null,
                'qualifying_format' => 'standard',
                'qualifying_length' => 15,
                'qualifying_tire' => null,
                'grid_source' => 'qualifying',
                'grid_source_race_id' => null,
                'length_type' => 'time',
                'length_value' => 15,
                'extra_lap_after_time' => false,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => false,
                'false_start_detection' => false,
                'collision_penalties' => false,
                'mandatory_pit_stop' => false,
                'minimum_pit_time' => null,
                'assists_restrictions' => null,
                'fastest_lap' => null,
                'fastest_lap_top_10' => false,
                'qualifying_pole' => 1,
                'qualifying_pole_top_10' => false,
                'race_points' => false,
                'points_system' => json_encode(['1' => 0]),
                'dnf_points' => 0,
                'dns_points' => 0,
                'race_notes' => null,
                'status' => 'completed',
                'created_at' => '2025-11-27 11:33:10',
                'updated_at' => '2025-12-02 04:21:50',
            ],
            [
                'id' => 2,
                'round_id' => 1,
                'is_qualifier' => false,
                'race_number' => 1,
                'name' => null,
                'race_type' => 'feature',
                'qualifying_format' => 'none',
                'qualifying_length' => null,
                'qualifying_tire' => null,
                'grid_source' => 'qualifying',
                'grid_source_race_id' => 1,
                'length_type' => 'laps',
                'length_value' => 20,
                'extra_lap_after_time' => false,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'mandatory_pit_stop' => false,
                'minimum_pit_time' => null,
                'assists_restrictions' => null,
                'fastest_lap' => null,
                'fastest_lap_top_10' => false,
                'qualifying_pole' => null,
                'qualifying_pole_top_10' => false,
                'race_points' => false,
                'points_system' => json_encode([
                    '1' => 25, '2' => 18, '3' => 15, '4' => 12, '5' => 10,
                    '6' => 8, '7' => 6, '8' => 4, '9' => 2, '10' => 1,
                ]),
                'dnf_points' => 0,
                'dns_points' => 0,
                'race_notes' => null,
                'status' => 'completed',
                'created_at' => '2025-11-27 11:51:26',
                'updated_at' => '2025-12-02 07:52:09',
            ],
            // Round 4 Races (Round 2)
            [
                'id' => 6,
                'round_id' => 4,
                'is_qualifier' => true,
                'race_number' => null,
                'name' => null,
                'race_type' => null,
                'qualifying_format' => 'standard',
                'qualifying_length' => 10,
                'qualifying_tire' => null,
                'grid_source' => 'qualifying',
                'grid_source_race_id' => null,
                'length_type' => 'time',
                'length_value' => 10,
                'extra_lap_after_time' => false,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => false,
                'false_start_detection' => false,
                'collision_penalties' => false,
                'mandatory_pit_stop' => false,
                'minimum_pit_time' => null,
                'assists_restrictions' => null,
                'fastest_lap' => null,
                'fastest_lap_top_10' => false,
                'qualifying_pole' => 1,
                'qualifying_pole_top_10' => false,
                'race_points' => false,
                'points_system' => json_encode(['1' => 0]),
                'dnf_points' => 0,
                'dns_points' => 0,
                'race_notes' => null,
                'status' => 'completed',
                'created_at' => '2025-12-02 10:08:34',
                'updated_at' => '2025-12-02 10:25:28',
            ],
            [
                'id' => 7,
                'round_id' => 4,
                'is_qualifier' => false,
                'race_number' => 1,
                'name' => null,
                'race_type' => 'sprint',
                'qualifying_format' => 'none',
                'qualifying_length' => null,
                'qualifying_tire' => null,
                'grid_source' => 'qualifying',
                'grid_source_race_id' => 6,
                'length_type' => 'laps',
                'length_value' => 20,
                'extra_lap_after_time' => false,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'mandatory_pit_stop' => false,
                'minimum_pit_time' => null,
                'assists_restrictions' => null,
                'fastest_lap' => 1,
                'fastest_lap_top_10' => false,
                'qualifying_pole' => null,
                'qualifying_pole_top_10' => false,
                'race_points' => true,
                'points_system' => json_encode([
                    '1' => 25, '2' => 20, '3' => 16, '4' => 13, '5' => 11, '6' => 10,
                    '7' => 9, '8' => 8, '9' => 7, '10' => 6, '11' => 5, '12' => 4,
                    '13' => 3, '14' => 2, '15' => 1, '16' => 0,
                ]),
                'dnf_points' => 0,
                'dns_points' => 0,
                'race_notes' => null,
                'status' => 'completed',
                'created_at' => '2025-12-02 10:09:33',
                'updated_at' => '2025-12-03 11:32:20',
            ],
            [
                'id' => 8,
                'round_id' => 4,
                'is_qualifier' => false,
                'race_number' => 2,
                'name' => null,
                'race_type' => 'sprint',
                'qualifying_format' => 'none',
                'qualifying_length' => null,
                'qualifying_tire' => null,
                'grid_source' => 'previous_race',
                'grid_source_race_id' => 7,
                'length_type' => 'laps',
                'length_value' => 20,
                'extra_lap_after_time' => false,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'mandatory_pit_stop' => false,
                'minimum_pit_time' => null,
                'assists_restrictions' => null,
                'fastest_lap' => 1,
                'fastest_lap_top_10' => false,
                'qualifying_pole' => null,
                'qualifying_pole_top_10' => false,
                'race_points' => true,
                'points_system' => json_encode([
                    '1' => 25, '2' => 20, '3' => 16, '4' => 13, '5' => 11, '6' => 10,
                    '7' => 9, '8' => 8, '9' => 7, '10' => 6, '11' => 5, '12' => 4,
                    '13' => 3, '14' => 2, '15' => 1, '16' => 0,
                ]),
                'dnf_points' => 0,
                'dns_points' => 0,
                'race_notes' => null,
                'status' => 'completed',
                'created_at' => '2025-12-02 10:09:47',
                'updated_at' => '2025-12-03 11:32:20',
            ],
            [
                'id' => 9,
                'round_id' => 4,
                'is_qualifier' => false,
                'race_number' => 3,
                'name' => null,
                'race_type' => 'sprint',
                'qualifying_format' => 'none',
                'qualifying_length' => null,
                'qualifying_tire' => null,
                'grid_source' => 'previous_race',
                'grid_source_race_id' => 8,
                'length_type' => 'laps',
                'length_value' => 20,
                'extra_lap_after_time' => false,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'mandatory_pit_stop' => false,
                'minimum_pit_time' => null,
                'assists_restrictions' => null,
                'fastest_lap' => 1,
                'fastest_lap_top_10' => false,
                'qualifying_pole' => null,
                'qualifying_pole_top_10' => false,
                'race_points' => true,
                'points_system' => json_encode([
                    '1' => 25, '2' => 20, '3' => 16, '4' => 13, '5' => 11, '6' => 10,
                    '7' => 9, '8' => 8, '9' => 7, '10' => 6, '11' => 5, '12' => 4,
                    '13' => 3, '14' => 2, '15' => 1, '16' => 0,
                ]),
                'dnf_points' => 0,
                'dns_points' => 0,
                'race_notes' => null,
                'status' => 'completed',
                'created_at' => '2025-12-02 10:10:01',
                'updated_at' => '2025-12-03 11:32:21',
            ],
        ];

        foreach ($races as $raceData) {
            Race::updateOrCreate(
                ['id' => $raceData['id']],
                $raceData
            );
        }

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info('Races backup seeded successfully. Total records: ' . count($races));
    }
}

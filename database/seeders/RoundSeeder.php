<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Infrastructure\Persistence\Eloquent\Models\Round;
use Illuminate\Database\Seeder;

class RoundSeeder extends Seeder
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
            $this->command->error('RoundSeeder cannot run in production environment!');
            return;
        }

        $rounds = [
            [
                'id' => 1,
                'season_id' => 4,
                'round_number' => 1,
                'name' => null,
                'slug' => 'round-1',
                'scheduled_at' => null,
                'timezone' => 'UTC',
                'platform_track_id' => 44,
                'track_layout' => null,
                'track_conditions' => null,
                'technical_notes' => null,
                'stream_url' => null,
                'internal_notes' => null,
                'fastest_lap' => null,
                'fastest_lap_top_10' => false,
                'qualifying_pole' => null,
                'qualifying_pole_top_10' => false,
                'points_system' => json_encode([
                    '1' => 25, '2' => 20, '3' => 16, '4' => 13, '5' => 11, '6' => 10,
                    '7' => 9, '8' => 8, '9' => 7, '10' => 6, '11' => 5, '12' => 4,
                    '13' => 3, '14' => 2, '15' => 1, '16' => 0,
                ]),
                'round_points' => true,
                'status' => 'completed',
                'round_results' => null,
                'qualifying_results' => null,
                'race_time_results' => null,
                'fastest_lap_results' => null,
                'created_by_user_id' => 1,
                'created_at' => '2025-11-27 11:25:50',
                'updated_at' => '2025-11-27 11:25:50',
            ],
            [
                'id' => 4,
                'season_id' => 4,
                'round_number' => 2,
                'name' => null,
                'slug' => 'round-2',
                'scheduled_at' => null,
                'timezone' => 'UTC',
                'platform_track_id' => 26,
                'track_layout' => null,
                'track_conditions' => null,
                'technical_notes' => null,
                'stream_url' => null,
                'internal_notes' => null,
                'fastest_lap' => null,
                'fastest_lap_top_10' => false,
                'qualifying_pole' => null,
                'qualifying_pole_top_10' => false,
                'points_system' => json_encode([
                    '1' => 25, '2' => 20, '3' => 16, '4' => 13, '5' => 11, '6' => 10,
                    '7' => 9, '8' => 8, '9' => 7, '10' => 6, '11' => 5, '12' => 4,
                    '13' => 3, '14' => 2, '15' => 1, '16' => 0,
                ]),
                'round_points' => true,
                'status' => 'completed',
                'round_results' => null,
                'qualifying_results' => null,
                'race_time_results' => null,
                'fastest_lap_results' => null,
                'created_by_user_id' => 1,
                'created_at' => '2025-11-27 11:25:50',
                'updated_at' => '2025-11-27 11:25:50',
            ],
        ];

        foreach ($rounds as $roundData) {
            Round::firstOrCreate(
                ['id' => $roundData['id']],
                $roundData
            );
        }

        $this->command->info('Rounds seeded successfully.');
    }
}

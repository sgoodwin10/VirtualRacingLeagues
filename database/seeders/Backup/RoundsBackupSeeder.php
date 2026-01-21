<?php

declare(strict_types=1);

namespace Database\Seeders\Backup;

use App\Infrastructure\Persistence\Eloquent\Models\Round;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * RoundsBackupSeeder
 *
 * This seeder restores the rounds table data from a backup.
 * Generated: 2026-01-07
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
                'points_system' => json_encode(array (
        1 => 25,
        2 => 20,
        3 => 16,
        4 => 13,
        5 => 11,
        6 => 10,
        7 => 9,
        8 => 8,
        9 => 7,
        10 => 6,
        11 => 5,
        12 => 4,
        13 => 3,
        14 => 2,
        15 => 1,
        16 => 0,
                )),
                'round_points' => true,
                'status' => 'completed',
                'round_results' => json_encode(array (
        'standings' =>
        array (
        0 =>
        array (
        'division_id' => 1,
        'division_name' => 'Division 1',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 25,
          'driver_name' => 'Dstinct_Andrew',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 1,
          'round_points' => 25,
          'total_points' => 26,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 54,
          'driver_name' => 'Rangeraus',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 20,
          'total_points' => 20,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 76,
          'driver_name' => 'warrior2167',
          'race_points' => 0,
          'fastest_lap_points' => 1,
          'pole_position_points' => 0,
          'round_points' => 16,
          'total_points' => 17,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 38,
          'driver_name' => 'JimothyPayload',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 13,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        4 =>
        array (
          'position' => 5,
          'driver_id' => 52,
          'driver_name' => 'pokeeetus',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 11,
          'total_points' => 11,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        5 =>
        array (
          'position' => 6,
          'driver_id' => 16,
          'driver_name' => 'CaptainRisky21',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 10,
          'total_points' => 10,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        6 =>
        array (
          'position' => 7,
          'driver_id' => 82,
          'driver_name' => 'BlockyRex1',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 0,
          'total_points' => 0,
          'total_positions_gained' => 0,
          'has_any_dnf' => true,
          'should_receive_zero_points' => true,
          'total_penalties' => '0.000',
        ),
        ),
        ),
        1 =>
        array (
        'division_id' => 4,
        'division_name' => 'Division 4',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 68,
          'driver_name' => 'Sylveon with a gun',
          'race_points' => 0,
          'fastest_lap_points' => 1,
          'pole_position_points' => 1,
          'round_points' => 25,
          'total_points' => 27,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 43,
          'driver_name' => 'Kiwi_kart_racer9',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 20,
          'total_points' => 20,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 62,
          'driver_name' => 'seowster',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 16,
          'total_points' => 16,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 50,
          'driver_name' => 'Natalie WA',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 13,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        4 =>
        array (
          'position' => 5,
          'driver_id' => 45,
          'driver_name' => 'Luppo',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 11,
          'total_points' => 11,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        5 =>
        array (
          'position' => 6,
          'driver_id' => 49,
          'driver_name' => 'Muzzie_013',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 10,
          'total_points' => 10,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        6 =>
        array (
          'position' => 7,
          'driver_id' => 34,
          'driver_name' => 'j. Farley',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 9,
          'total_points' => 9,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        7 =>
        array (
          'position' => 8,
          'driver_id' => 17,
          'driver_name' => 'Charlie chops',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 8,
          'total_points' => 8,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        8 =>
        array (
          'position' => 9,
          'driver_id' => 36,
          'driver_name' => 'JC_Blaize',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 7,
          'total_points' => 7,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        9 =>
        array (
          'position' => 10,
          'driver_id' => 78,
          'driver_name' => 'Wolfy 1961',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 6,
          'total_points' => 6,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        10 =>
        array (
          'position' => 11,
          'driver_id' => 3,
          'driver_name' => 'arnoldwa',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 0,
          'total_points' => 0,
          'total_positions_gained' => 0,
          'has_any_dnf' => true,
          'should_receive_zero_points' => true,
          'total_penalties' => '0.000',
        ),
        ),
        ),
        2 =>
        array (
        'division_id' => 3,
        'division_name' => 'Division 3',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 64,
          'driver_name' => 'slarty',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 1,
          'round_points' => 25,
          'total_points' => 26,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 22,
          'driver_name' => 'Donsflyup',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 20,
          'total_points' => 20,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 70,
          'driver_name' => 'T-GT Racing',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 16,
          'total_points' => 16,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 59,
          'driver_name' => 'Schumojo 13',
          'race_points' => 0,
          'fastest_lap_points' => 1,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 14,
          'total_positions_gained' => 3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        4 =>
        array (
          'position' => 5,
          'driver_id' => 66,
          'driver_name' => 'Steve_73_GOOF',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 11,
          'total_points' => 11,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        5 =>
        array (
          'position' => 6,
          'driver_id' => 2,
          'driver_name' => 'anders_race',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 10,
          'total_points' => 10,
          'total_positions_gained' => -3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        6 =>
        array (
          'position' => 7,
          'driver_id' => 51,
          'driver_name' => 'Ozglenn',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 9,
          'total_points' => 9,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        7 =>
        array (
          'position' => 8,
          'driver_id' => 9,
          'driver_name' => 'Beats',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 8,
          'total_points' => 8,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        8 =>
        array (
          'position' => 9,
          'driver_id' => 14,
          'driver_name' => 'BritzLightning55',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 7,
          'total_points' => 7,
          'total_positions_gained' => -3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        9 =>
        array (
          'position' => 10,
          'driver_id' => 30,
          'driver_name' => 'Half-Byte',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 6,
          'total_points' => 6,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        10 =>
        array (
          'position' => 11,
          'driver_id' => 55,
          'driver_name' => 'RBRHoges97',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 5,
          'total_points' => 5,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        11 =>
        array (
          'position' => 12,
          'driver_id' => 28,
          'driver_name' => 'Emmo',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 4,
          'total_points' => 4,
          'total_positions_gained' => -2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        12 =>
        array (
          'position' => 13,
          'driver_id' => 74,
          'driver_name' => 'Vert Wheeler',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 3,
          'total_points' => 3,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        ),
        ),
        3 =>
        array (
        'division_id' => 2,
        'division_name' => 'Division 2',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 73,
          'driver_name' => 'UrsineSaturn9',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 1,
          'round_points' => 25,
          'total_points' => 26,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 26,
          'driver_name' => 'E. Presley',
          'race_points' => 0,
          'fastest_lap_points' => 1,
          'pole_position_points' => 0,
          'round_points' => 20,
          'total_points' => 21,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 24,
          'driver_name' => 'DRZ-Hatfield',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 16,
          'total_points' => 16,
          'total_positions_gained' => 7,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 13,
          'driver_name' => 'Bob Massie',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 13,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        4 =>
        array (
          'position' => 5,
          'driver_id' => 60,
          'driver_name' => 'Selduin',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 11,
          'total_points' => 11,
          'total_positions_gained' => -2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        5 =>
        array (
          'position' => 6,
          'driver_id' => 15,
          'driver_name' => 'btwong',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 10,
          'total_points' => 10,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        6 =>
        array (
          'position' => 7,
          'driver_id' => 23,
          'driver_name' => 'Doodah27',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 9,
          'total_points' => 9,
          'total_positions_gained' => -3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        7 =>
        array (
          'position' => 8,
          'driver_id' => 67,
          'driver_name' => 'Stinky',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 8,
          'total_points' => 8,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        8 =>
        array (
          'position' => 9,
          'driver_id' => 6,
          'driver_name' => 'B. CakePie',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 7,
          'total_points' => 7,
          'total_positions_gained' => 4,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        9 =>
        array (
          'position' => 10,
          'driver_id' => 77,
          'driver_name' => 'Whizz94',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 6,
          'total_points' => 6,
          'total_positions_gained' => -3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        10 =>
        array (
          'position' => 11,
          'driver_id' => 40,
          'driver_name' => 'K. Brown',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 5,
          'total_points' => 5,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        11 =>
        array (
          'position' => 12,
          'driver_id' => 1,
          'driver_name' => 'Alexb8891',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 4,
          'total_points' => 4,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        12 =>
        array (
          'position' => 13,
          'driver_id' => 37,
          'driver_name' => 'Jelly Mechanic',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 3,
          'total_points' => 3,
          'total_positions_gained' => -4,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        13 =>
        array (
          'position' => 14,
          'driver_id' => 79,
          'driver_name' => 'X-3vi1 m00n',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 2,
          'total_points' => 2,
          'total_positions_gained' => -2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        ),
        ),
                ),
                )),
                'qualifying_results' => json_encode(array (
        0 =>
        array (
        'race_result_id' => 1,
        'time_ms' => 102250,
        'position' => 1,
                ),
                1 =>
                array (
                'race_result_id' => 2,
                'time_ms' => 102475,
                'position' => 2,
                ),
                2 =>
                array (
                'race_result_id' => 3,
                'time_ms' => 102585,
                'position' => 3,
                ),
                3 =>
                array (
                'race_result_id' => 4,
                'time_ms' => 102724,
                'position' => 4,
                ),
                4 =>
                array (
                'race_result_id' => 5,
                'time_ms' => 103180,
                'position' => 5,
                ),
                5 =>
                array (
                'race_result_id' => 6,
                'time_ms' => 103401,
                'position' => 6,
                ),
                6 =>
                array (
                'race_result_id' => 8,
                'time_ms' => 103546,
                'position' => 7,
                ),
                7 =>
                array (
                'race_result_id' => 7,
                'time_ms' => 103645,
                'position' => 8,
                ),
                8 =>
                array (
                'race_result_id' => 9,
                'time_ms' => 104023,
                'position' => 9,
                ),
                9 =>
                array (
                'race_result_id' => 10,
                'time_ms' => 104112,
                'position' => 10,
                ),
                10 =>
                array (
                'race_result_id' => 22,
                'time_ms' => 104184,
                'position' => 11,
                ),
                11 =>
                array (
                'race_result_id' => 11,
                'time_ms' => 104187,
                'position' => 12,
                ),
                12 =>
                array (
                'race_result_id' => 12,
                'time_ms' => 104405,
                'position' => 13,
                ),
                13 =>
                array (
                'race_result_id' => 13,
                'time_ms' => 104462,
                'position' => 14,
                ),
                14 =>
                array (
                'race_result_id' => 23,
                'time_ms' => 104464,
                'position' => 15,
                ),
                15 =>
                array (
                'race_result_id' => 14,
                'time_ms' => 104474,
                'position' => 16,
                ),
                16 =>
                array (
                'race_result_id' => 15,
                'time_ms' => 104585,
                'position' => 17,
                ),
                17 =>
                array (
                'race_result_id' => 24,
                'time_ms' => 104602,
                'position' => 18,
                ),
                18 =>
                array (
                'race_result_id' => 16,
                'time_ms' => 104620,
                'position' => 19,
                ),
                19 =>
                array (
                'race_result_id' => 17,
                'time_ms' => 104708,
                'position' => 20,
                ),
                20 =>
                array (
                'race_result_id' => 25,
                'time_ms' => 104750,
                'position' => 21,
                ),
                21 =>
                array (
                'race_result_id' => 35,
                'time_ms' => 104776,
                'position' => 22,
                ),
                22 =>
                array (
                'race_result_id' => 26,
                'time_ms' => 104802,
                'position' => 23,
                ),
                23 =>
                array (
                'race_result_id' => 18,
                'time_ms' => 104829,
                'position' => 24,
                ),
                24 =>
                array (
                'race_result_id' => 27,
                'time_ms' => 104906,
                'position' => 25,
                ),
                25 =>
                array (
                'race_result_id' => 28,
                'time_ms' => 104931,
                'position' => 26,
                ),
                26 =>
                array (
                'race_result_id' => 19,
                'time_ms' => 104980,
                'position' => 27,
                ),
                27 =>
                array (
                'race_result_id' => 20,
                'time_ms' => 105011,
                'position' => 28,
                ),
                28 =>
                array (
                'race_result_id' => 21,
                'time_ms' => 105049,
                'position' => 29,
                ),
                29 =>
                array (
                'race_result_id' => 36,
                'time_ms' => 105139,
                'position' => 30,
                ),
                30 =>
                array (
                'race_result_id' => 29,
                'time_ms' => 105163,
                'position' => 31,
                ),
                31 =>
                array (
                'race_result_id' => 30,
                'time_ms' => 105240,
                'position' => 32,
                ),
                32 =>
                array (
                'race_result_id' => 31,
                'time_ms' => 105280,
                'position' => 33,
                ),
                33 =>
                array (
                'race_result_id' => 37,
                'time_ms' => 105478,
                'position' => 34,
                ),
                34 =>
                array (
                'race_result_id' => 32,
                'time_ms' => 105700,
                'position' => 35,
                ),
                35 =>
                array (
                'race_result_id' => 38,
                'time_ms' => 105873,
                'position' => 36,
                ),
                36 =>
                array (
                'race_result_id' => 39,
                'time_ms' => 106047,
                'position' => 37,
                ),
                37 =>
                array (
                'race_result_id' => 40,
                'time_ms' => 106055,
                'position' => 38,
                ),
                38 =>
                array (
                'race_result_id' => 41,
                'time_ms' => 106238,
                'position' => 39,
                ),
                39 =>
                array (
                'race_result_id' => 42,
                'time_ms' => 106554,
                'position' => 40,
                ),
                40 =>
                array (
                'race_result_id' => 33,
                'time_ms' => 106865,
                'position' => 41,
                ),
                41 =>
                array (
                'race_result_id' => 43,
                'time_ms' => 106978,
                'position' => 42,
                ),
                42 =>
                array (
                'race_result_id' => 34,
                'time_ms' => 106995,
                'position' => 43,
                ),
                43 =>
                array (
                'race_result_id' => 44,
                'time_ms' => 107929,
                'position' => 44,
                ),
                44 =>
                array (
                'race_result_id' => 45,
                'time_ms' => 108800,
                'position' => 45,
                ),
                )),
                'race_time_results' => json_encode(array (
        0 =>
        array (
        'race_result_id' => 1096,
        'time_ms' => 2596862,
        'position' => 1,
                ),
                1 =>
                array (
                'race_result_id' => 1097,
                'time_ms' => 2598028,
                'position' => 2,
                ),
                2 =>
                array (
                'race_result_id' => 1098,
                'time_ms' => 2603126,
                'position' => 3,
                ),
                3 =>
                array (
                'race_result_id' => 1099,
                'time_ms' => 2623451,
                'position' => 4,
                ),
                4 =>
                array (
                'race_result_id' => 1100,
                'time_ms' => 2623596,
                'position' => 5,
                ),
                5 =>
                array (
                'race_result_id' => 1101,
                'time_ms' => 2625823,
                'position' => 6,
                ),
                6 =>
                array (
                'race_result_id' => 1127,
                'time_ms' => 2640470,
                'position' => 7,
                ),
                7 =>
                array (
                'race_result_id' => 1128,
                'time_ms' => 2641084,
                'position' => 8,
                ),
                8 =>
                array (
                'race_result_id' => 1129,
                'time_ms' => 2647948,
                'position' => 9,
                ),
                9 =>
                array (
                'race_result_id' => 1130,
                'time_ms' => 2649040,
                'position' => 10,
                ),
                10 =>
                array (
                'race_result_id' => 1131,
                'time_ms' => 2649415,
                'position' => 11,
                ),
                11 =>
                array (
                'race_result_id' => 1114,
                'time_ms' => 2650193,
                'position' => 12,
                ),
                12 =>
                array (
                'race_result_id' => 1132,
                'time_ms' => 2654607,
                'position' => 13,
                ),
                13 =>
                array (
                'race_result_id' => 1115,
                'time_ms' => 2655265,
                'position' => 14,
                ),
                14 =>
                array (
                'race_result_id' => 1116,
                'time_ms' => 2656644,
                'position' => 15,
                ),
                15 =>
                array (
                'race_result_id' => 1133,
                'time_ms' => 2659271,
                'position' => 16,
                ),
                16 =>
                array (
                'race_result_id' => 1103,
                'time_ms' => 2663113,
                'position' => 17,
                ),
                17 =>
                array (
                'race_result_id' => 1117,
                'time_ms' => 2663780,
                'position' => 18,
                ),
                18 =>
                array (
                'race_result_id' => 1134,
                'time_ms' => 2664243,
                'position' => 19,
                ),
                19 =>
                array (
                'race_result_id' => 1135,
                'time_ms' => 2667103,
                'position' => 20,
                ),
                20 =>
                array (
                'race_result_id' => 1136,
                'time_ms' => 2668532,
                'position' => 21,
                ),
                21 =>
                array (
                'race_result_id' => 1137,
                'time_ms' => 2668828,
                'position' => 22,
                ),
                22 =>
                array (
                'race_result_id' => 1138,
                'time_ms' => 2669161,
                'position' => 23,
                ),
                23 =>
                array (
                'race_result_id' => 1118,
                'time_ms' => 2669863,
                'position' => 24,
                ),
                24 =>
                array (
                'race_result_id' => 1119,
                'time_ms' => 2672999,
                'position' => 25,
                ),
                25 =>
                array (
                'race_result_id' => 1120,
                'time_ms' => 2673172,
                'position' => 26,
                ),
                26 =>
                array (
                'race_result_id' => 1121,
                'time_ms' => 2675027,
                'position' => 27,
                ),
                27 =>
                array (
                'race_result_id' => 1139,
                'time_ms' => 2675227,
                'position' => 28,
                ),
                28 =>
                array (
                'race_result_id' => 1104,
                'time_ms' => 2683459,
                'position' => 29,
                ),
                29 =>
                array (
                'race_result_id' => 1122,
                'time_ms' => 2685317,
                'position' => 30,
                ),
                30 =>
                array (
                'race_result_id' => 1105,
                'time_ms' => 2688379,
                'position' => 31,
                ),
                31 =>
                array (
                'race_result_id' => 1123,
                'time_ms' => 2693125,
                'position' => 32,
                ),
                32 =>
                array (
                'race_result_id' => 1124,
                'time_ms' => 2699296,
                'position' => 33,
                ),
                33 =>
                array (
                'race_result_id' => 1125,
                'time_ms' => 2700294,
                'position' => 34,
                ),
                34 =>
                array (
                'race_result_id' => 1106,
                'time_ms' => 2701105,
                'position' => 35,
                ),
                35 =>
                array (
                'race_result_id' => 1107,
                'time_ms' => 2702360,
                'position' => 36,
                ),
                36 =>
                array (
                'race_result_id' => 1108,
                'time_ms' => 2703763,
                'position' => 37,
                ),
                37 =>
                array (
                'race_result_id' => 1109,
                'time_ms' => 2709782,
                'position' => 38,
                ),
                38 =>
                array (
                'race_result_id' => 1126,
                'time_ms' => 2727062,
                'position' => 39,
                ),
                39 =>
                array (
                'race_result_id' => 1140,
                'time_ms' => 2744480,
                'position' => 40,
                ),
                40 =>
                array (
                'race_result_id' => 1110,
                'time_ms' => 2748793,
                'position' => 41,
                ),
                41 =>
                array (
                'race_result_id' => 1111,
                'time_ms' => 2769912,
                'position' => 42,
                ),
                42 =>
                array (
                'race_result_id' => 1112,
                'time_ms' => 2770923,
                'position' => 43,
                ),
                )),
                'fastest_lap_results' => json_encode(array (
        0 =>
        array (
        'race_result_id' => 1098,
        'time_ms' => 102044,
        'position' => 1,
                ),
                1 =>
                array (
                'race_result_id' => 1096,
                'time_ms' => 102253,
                'position' => 2,
                ),
                2 =>
                array (
                'race_result_id' => 1097,
                'time_ms' => 102378,
                'position' => 3,
                ),
                3 =>
                array (
                'race_result_id' => 1100,
                'time_ms' => 102744,
                'position' => 4,
                ),
                4 =>
                array (
                'race_result_id' => 1101,
                'time_ms' => 102830,
                'position' => 5,
                ),
                5 =>
                array (
                'race_result_id' => 1099,
                'time_ms' => 102961,
                'position' => 6,
                ),
                6 =>
                array (
                'race_result_id' => 1102,
                'time_ms' => 103695,
                'position' => 7,
                ),
                7 =>
                array (
                'race_result_id' => 1128,
                'time_ms' => 103845,
                'position' => 8,
                ),
                8 =>
                array (
                'race_result_id' => 1127,
                'time_ms' => 103856,
                'position' => 9,
                ),
                9 =>
                array (
                'race_result_id' => 1137,
                'time_ms' => 103863,
                'position' => 10,
                ),
                10 =>
                array (
                'race_result_id' => 1139,
                'time_ms' => 103989,
                'position' => 11,
                ),
                11 =>
                array (
                'race_result_id' => 1117,
                'time_ms' => 104012,
                'position' => 12,
                ),
                12 =>
                array (
                'race_result_id' => 1114,
                'time_ms' => 104067,
                'position' => 13,
                ),
                13 =>
                array (
                'race_result_id' => 1133,
                'time_ms' => 104084,
                'position' => 14,
                ),
                14 =>
                array (
                'race_result_id' => 1130,
                'time_ms' => 104115,
                'position' => 15,
                ),
                15 =>
                array (
                'race_result_id' => 1131,
                'time_ms' => 104142,
                'position' => 16,
                ),
                16 =>
                array (
                'race_result_id' => 1121,
                'time_ms' => 104165,
                'position' => 17,
                ),
                17 =>
                array (
                'race_result_id' => 1136,
                'time_ms' => 104208,
                'position' => 18,
                ),
                18 =>
                array (
                'race_result_id' => 1132,
                'time_ms' => 104232,
                'position' => 19,
                ),
                19 =>
                array (
                'race_result_id' => 1129,
                'time_ms' => 104269,
                'position' => 20,
                ),
                20 =>
                array (
                'race_result_id' => 1103,
                'time_ms' => 104276,
                'position' => 21,
                ),
                21 =>
                array (
                'race_result_id' => 1116,
                'time_ms' => 104297,
                'position' => 22,
                ),
                22 =>
                array (
                'race_result_id' => 1115,
                'time_ms' => 104300,
                'position' => 23,
                ),
                23 =>
                array (
                'race_result_id' => 1138,
                'time_ms' => 104303,
                'position' => 24,
                ),
                24 =>
                array (
                'race_result_id' => 1106,
                'time_ms' => 104307,
                'position' => 25,
                ),
                25 =>
                array (
                'race_result_id' => 1120,
                'time_ms' => 104510,
                'position' => 26,
                ),
                26 =>
                array (
                'race_result_id' => 1118,
                'time_ms' => 104514,
                'position' => 27,
                ),
                27 =>
                array (
                'race_result_id' => 1135,
                'time_ms' => 104550,
                'position' => 28,
                ),
                28 =>
                array (
                'race_result_id' => 1134,
                'time_ms' => 104569,
                'position' => 29,
                ),
                29 =>
                array (
                'race_result_id' => 1123,
                'time_ms' => 104598,
                'position' => 30,
                ),
                30 =>
                array (
                'race_result_id' => 1140,
                'time_ms' => 104645,
                'position' => 31,
                ),
                31 =>
                array (
                'race_result_id' => 1125,
                'time_ms' => 104748,
                'position' => 32,
                ),
                32 =>
                array (
                'race_result_id' => 1119,
                'time_ms' => 104834,
                'position' => 33,
                ),
                33 =>
                array (
                'race_result_id' => 1104,
                'time_ms' => 104836,
                'position' => 34,
                ),
                34 =>
                array (
                'race_result_id' => 1108,
                'time_ms' => 104909,
                'position' => 35,
                ),
                35 =>
                array (
                'race_result_id' => 1122,
                'time_ms' => 104922,
                'position' => 36,
                ),
                36 =>
                array (
                'race_result_id' => 1124,
                'time_ms' => 105190,
                'position' => 37,
                ),
                37 =>
                array (
                'race_result_id' => 1105,
                'time_ms' => 105469,
                'position' => 38,
                ),
                38 =>
                array (
                'race_result_id' => 1109,
                'time_ms' => 105675,
                'position' => 39,
                ),
                39 =>
                array (
                'race_result_id' => 1111,
                'time_ms' => 105699,
                'position' => 40,
                ),
                40 =>
                array (
                'race_result_id' => 1107,
                'time_ms' => 105874,
                'position' => 41,
                ),
                41 =>
                array (
                'race_result_id' => 1126,
                'time_ms' => 106010,
                'position' => 42,
                ),
                42 =>
                array (
                'race_result_id' => 1113,
                'time_ms' => 106726,
                'position' => 43,
                ),
                43 =>
                array (
                'race_result_id' => 1110,
                'time_ms' => 106820,
                'position' => 44,
                ),
                44 =>
                array (
                'race_result_id' => 1112,
                'time_ms' => 107810,
                'position' => 45,
                ),
                )),
                'created_by_user_id' => 1,
                'created_at' => '2025-11-27 11:25:50',
                'updated_at' => '2025-12-31 03:59:23',
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
                'points_system' => json_encode(array (
            1 => 25,
            2 => 20,
            3 => 16,
            4 => 13,
            5 => 11,
            6 => 10,
            7 => 9,
            8 => 8,
            9 => 7,
            10 => 6,
            11 => 5,
            12 => 4,
            13 => 3,
            14 => 2,
            15 => 1,
            16 => 0,
                )),
                'round_points' => true,
                'status' => 'completed',
                'round_results' => json_encode(array (
        'standings' =>
        array (
        0 =>
        array (
        'division_id' => 1,
        'division_name' => 'Division 1',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 76,
          'driver_name' => 'warrior2167',
          'race_points' => 79,
          'fastest_lap_points' => 1,
          'pole_position_points' => 1,
          'round_points' => 25,
          'total_points' => 27,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 54,
          'driver_name' => 'Rangeraus',
          'race_points' => 56,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 20,
          'total_points' => 20,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 16,
          'driver_name' => 'CaptainRisky21',
          'race_points' => 52,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 16,
          'total_points' => 16,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 52,
          'driver_name' => 'pokeeetus',
          'race_points' => 39,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 13,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        4 =>
        array (
          'position' => 5,
          'driver_id' => 75,
          'driver_name' => 'Viperzed',
          'race_points' => 33,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 11,
          'total_points' => 11,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        5 =>
        array (
          'position' => 6,
          'driver_id' => 38,
          'driver_name' => 'JimothyPayload',
          'race_points' => 30,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 10,
          'total_points' => 10,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        ),
        ),
        1 =>
        array (
        'division_id' => 4,
        'division_name' => 'Division 4',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 31,
          'driver_name' => 'Hatchy3_',
          'race_points' => 63,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 25,
          'total_points' => 25,
          'total_positions_gained' => 3,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 43,
          'driver_name' => 'Kiwi_kart_racer9',
          'race_points' => 56,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 20,
          'total_points' => 20,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 74,
          'driver_name' => 'Vert Wheeler',
          'race_points' => 51,
          'fastest_lap_points' => 1,
          'pole_position_points' => 1,
          'round_points' => 16,
          'total_points' => 18,
          'total_positions_gained' => -4,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 12,
          'driver_name' => 'Bluntman75',
          'race_points' => 49,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 13,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        4 =>
        array (
          'position' => 5,
          'driver_id' => 62,
          'driver_name' => 'seowster',
          'race_points' => 40,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 11,
          'total_points' => 11,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        5 =>
        array (
          'position' => 6,
          'driver_id' => 49,
          'driver_name' => 'Muzzie_013',
          'race_points' => 30,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 10,
          'total_points' => 10,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        6 =>
        array (
          'position' => 7,
          'driver_id' => 33,
          'driver_name' => 'ITZ_JZH17',
          'race_points' => 25,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 9,
          'total_points' => 9,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        7 =>
        array (
          'position' => 8,
          'driver_id' => 36,
          'driver_name' => 'JC_Blaize',
          'race_points' => 21,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 8,
          'total_points' => 8,
          'total_positions_gained' => -2,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        8 =>
        array (
          'position' => 9,
          'driver_id' => 35,
          'driver_name' => 'J.Nightingale',
          'race_points' => 19,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 7,
          'total_points' => 7,
          'total_positions_gained' => 5,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        9 =>
        array (
          'position' => 10,
          'driver_id' => 45,
          'driver_name' => 'Luppo',
          'race_points' => 16,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 6,
          'total_points' => 6,
          'total_positions_gained' => 4,
          'has_any_dnf' => true,
          'total_penalties' => '0.000',
        ),
        10 =>
        array (
          'position' => 11,
          'driver_id' => 50,
          'driver_name' => 'Natalie WA',
          'race_points' => 15,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 5,
          'total_points' => 5,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        11 =>
        array (
          'position' => 12,
          'driver_id' => 3,
          'driver_name' => 'arnoldwa',
          'race_points' => 14,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 4,
          'total_points' => 4,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        12 =>
        array (
          'position' => 13,
          'driver_id' => 78,
          'driver_name' => 'Wolfy 1961',
          'race_points' => 9,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 3,
          'total_points' => 3,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        13 =>
        array (
          'position' => 14,
          'driver_id' => 17,
          'driver_name' => 'Charlie chops',
          'race_points' => 8,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 2,
          'total_points' => 2,
          'total_positions_gained' => 0,
          'has_any_dnf' => true,
          'total_penalties' => '0.000',
        ),
        ),
        ),
        2 =>
        array (
        'division_id' => 3,
        'division_name' => 'Division 3',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 68,
          'driver_name' => 'Sylveon with a gun',
          'race_points' => 73,
          'fastest_lap_points' => 1,
          'pole_position_points' => 1,
          'round_points' => 25,
          'total_points' => 27,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 66,
          'driver_name' => 'Steve_73_GOOF',
          'race_points' => 66,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 20,
          'total_points' => 20,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 69,
          'driver_name' => 'T F Eccles',
          'race_points' => 42,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 16,
          'total_points' => 16,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 30,
          'driver_name' => 'Half-Byte',
          'race_points' => 42,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 13,
          'total_positions_gained' => 4,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        4 =>
        array (
          'position' => 5,
          'driver_id' => 22,
          'driver_name' => 'Donsflyup',
          'race_points' => 35,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 11,
          'total_points' => 11,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        5 =>
        array (
          'position' => 6,
          'driver_id' => 51,
          'driver_name' => 'Ozglenn',
          'race_points' => 30,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 10,
          'total_points' => 10,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        6 =>
        array (
          'position' => 7,
          'driver_id' => 70,
          'driver_name' => 'T-GT Racing',
          'race_points' => 28,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 9,
          'total_points' => 9,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        7 =>
        array (
          'position' => 8,
          'driver_id' => 20,
          'driver_name' => 'Dash_Vanguard',
          'race_points' => 24,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 8,
          'total_points' => 8,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        8 =>
        array (
          'position' => 9,
          'driver_id' => 14,
          'driver_name' => 'BritzLightning55',
          'race_points' => 19,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 7,
          'total_points' => 7,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        9 =>
        array (
          'position' => 10,
          'driver_id' => 9,
          'driver_name' => 'Beats',
          'race_points' => 15,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 6,
          'total_points' => 6,
          'total_positions_gained' => 4,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        10 =>
        array (
          'position' => 11,
          'driver_id' => 2,
          'driver_name' => 'anders_race',
          'race_points' => 15,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 5,
          'total_points' => 5,
          'total_positions_gained' => 3,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        11 =>
        array (
          'position' => 12,
          'driver_id' => 59,
          'driver_name' => 'Schumojo 13',
          'race_points' => 12,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 4,
          'total_points' => 4,
          'total_positions_gained' => -10,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        12 =>
        array (
          'position' => 13,
          'driver_id' => 28,
          'driver_name' => 'Emmo',
          'race_points' => 9,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 3,
          'total_points' => 3,
          'total_positions_gained' => -7,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        13 =>
        array (
          'position' => 14,
          'driver_id' => 79,
          'driver_name' => 'X-3vi1 m00n',
          'race_points' => 9,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 2,
          'total_points' => 2,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        14 =>
        array (
          'position' => 15,
          'driver_id' => 55,
          'driver_name' => 'RBRHoges97',
          'race_points' => 3,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 1,
          'total_points' => 1,
          'total_positions_gained' => 3,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        15 =>
        array (
          'position' => 16,
          'driver_id' => 58,
          'driver_name' => 'Savage_Duck_75',
          'race_points' => 2,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 0,
          'total_points' => 0,
          'total_positions_gained' => -1,
          'has_any_dnf' => true,
          'total_penalties' => '0.000',
        ),
        ),
        ),
        3 =>
        array (
        'division_id' => 2,
        'division_name' => 'Division 2',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 47,
          'driver_name' => 'Matthyus',
          'race_points' => 77,
          'fastest_lap_points' => 0,
          'pole_position_points' => 1,
          'round_points' => 25,
          'total_points' => 26,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 1,
          'driver_name' => 'Alexb8891',
          'race_points' => 56,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 20,
          'total_points' => 20,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 26,
          'driver_name' => 'E. Presley',
          'race_points' => 47,
          'fastest_lap_points' => 1,
          'pole_position_points' => 0,
          'round_points' => 16,
          'total_points' => 17,
          'total_positions_gained' => -4,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 24,
          'driver_name' => 'DRZ-Hatfield',
          'race_points' => 40,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 13,
          'total_positions_gained' => 5,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        4 =>
        array (
          'position' => 5,
          'driver_id' => 65,
          'driver_name' => 'Snorxal',
          'race_points' => 35,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 11,
          'total_points' => 11,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        5 =>
        array (
          'position' => 6,
          'driver_id' => 67,
          'driver_name' => 'Stinky',
          'race_points' => 31,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 10,
          'total_points' => 10,
          'total_positions_gained' => -3,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        6 =>
        array (
          'position' => 7,
          'driver_id' => 15,
          'driver_name' => 'btwong',
          'race_points' => 29,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 9,
          'total_points' => 9,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        7 =>
        array (
          'position' => 8,
          'driver_id' => 40,
          'driver_name' => 'K. Brown',
          'race_points' => 19,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 8,
          'total_points' => 8,
          'total_positions_gained' => -5,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        8 =>
        array (
          'position' => 9,
          'driver_id' => 37,
          'driver_name' => 'Jelly Mechanic',
          'race_points' => 19,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 7,
          'total_points' => 7,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        9 =>
        array (
          'position' => 10,
          'driver_id' => 23,
          'driver_name' => 'Doodah27',
          'race_points' => 18,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 6,
          'total_points' => 6,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        10 =>
        array (
          'position' => 11,
          'driver_id' => 77,
          'driver_name' => 'Whizz94',
          'race_points' => 18,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 5,
          'total_points' => 5,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        11 =>
        array (
          'position' => 12,
          'driver_id' => 6,
          'driver_name' => 'B. CakePie',
          'race_points' => 17,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 4,
          'total_points' => 4,
          'total_positions_gained' => 5,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        ),
        ),
                ),
                )),
                'qualifying_results' => json_encode(array (
        0 =>
        array (
        'race_result_id' => 1141,
        'time_ms' => 80697,
        'position' => 1,
                ),
                1 =>
                array (
                'race_result_id' => 1142,
                'time_ms' => 80824,
                'position' => 2,
                ),
                2 =>
                array (
                'race_result_id' => 1143,
                'time_ms' => 81135,
                'position' => 3,
                ),
                3 =>
                array (
                'race_result_id' => 1144,
                'time_ms' => 81448,
                'position' => 4,
                ),
                4 =>
                array (
                'race_result_id' => 1177,
                'time_ms' => 81801,
                'position' => 5,
                ),
                5 =>
                array (
                'race_result_id' => 1147,
                'time_ms' => 81802,
                'position' => 6,
                ),
                6 =>
                array (
                'race_result_id' => 1178,
                'time_ms' => 81854,
                'position' => 7,
                ),
                7 =>
                array (
                'race_result_id' => 1148,
                'time_ms' => 82062,
                'position' => 8,
                ),
                8 =>
                array (
                'race_result_id' => 1179,
                'time_ms' => 82079,
                'position' => 9,
                ),
                9 =>
                array (
                'race_result_id' => 1145,
                'time_ms' => 82323,
                'position' => 10,
                ),
                10 =>
                array (
                'race_result_id' => 1180,
                'time_ms' => 82341,
                'position' => 11,
                ),
                11 =>
                array (
                'race_result_id' => 1181,
                'time_ms' => 82513,
                'position' => 12,
                ),
                12 =>
                array (
                'race_result_id' => 1182,
                'time_ms' => 82629,
                'position' => 13,
                ),
                13 =>
                array (
                'race_result_id' => 1149,
                'time_ms' => 82686,
                'position' => 14,
                ),
                14 =>
                array (
                'race_result_id' => 1146,
                'time_ms' => 82758,
                'position' => 15,
                ),
                15 =>
                array (
                'race_result_id' => 1150,
                'time_ms' => 82882,
                'position' => 16,
                ),
                16 =>
                array (
                'race_result_id' => 1151,
                'time_ms' => 82922,
                'position' => 17,
                ),
                17 =>
                array (
                'race_result_id' => 1152,
                'time_ms' => 82950,
                'position' => 18,
                ),
                18 =>
                array (
                'race_result_id' => 1163,
                'time_ms' => 83090,
                'position' => 19,
                ),
                19 =>
                array (
                'race_result_id' => 1153,
                'time_ms' => 83109,
                'position' => 20,
                ),
                20 =>
                array (
                'race_result_id' => 1164,
                'time_ms' => 83143,
                'position' => 21,
                ),
                21 =>
                array (
                'race_result_id' => 1183,
                'time_ms' => 83270,
                'position' => 22,
                ),
                22 =>
                array (
                'race_result_id' => 1154,
                'time_ms' => 83379,
                'position' => 23,
                ),
                23 =>
                array (
                'race_result_id' => 1184,
                'time_ms' => 83407,
                'position' => 24,
                ),
                24 =>
                array (
                'race_result_id' => 1155,
                'time_ms' => 83591,
                'position' => 25,
                ),
                25 =>
                array (
                'race_result_id' => 1185,
                'time_ms' => 83657,
                'position' => 26,
                ),
                26 =>
                array (
                'race_result_id' => 1156,
                'time_ms' => 83814,
                'position' => 27,
                ),
                27 =>
                array (
                'race_result_id' => 1165,
                'time_ms' => 83829,
                'position' => 28,
                ),
                28 =>
                array (
                'race_result_id' => 1157,
                'time_ms' => 83839,
                'position' => 29,
                ),
                29 =>
                array (
                'race_result_id' => 1158,
                'time_ms' => 83893,
                'position' => 30,
                ),
                30 =>
                array (
                'race_result_id' => 1166,
                'time_ms' => 83900,
                'position' => 31,
                ),
                31 =>
                array (
                'race_result_id' => 1167,
                'time_ms' => 83968,
                'position' => 32,
                ),
                32 =>
                array (
                'race_result_id' => 1186,
                'time_ms' => 84108,
                'position' => 33,
                ),
                33 =>
                array (
                'race_result_id' => 1168,
                'time_ms' => 84395,
                'position' => 34,
                ),
                34 =>
                array (
                'race_result_id' => 1169,
                'time_ms' => 84700,
                'position' => 35,
                ),
                35 =>
                array (
                'race_result_id' => 1170,
                'time_ms' => 84783,
                'position' => 36,
                ),
                36 =>
                array (
                'race_result_id' => 1159,
                'time_ms' => 84848,
                'position' => 37,
                ),
                37 =>
                array (
                'race_result_id' => 1171,
                'time_ms' => 84872,
                'position' => 38,
                ),
                38 =>
                array (
                'race_result_id' => 1160,
                'time_ms' => 85256,
                'position' => 39,
                ),
                39 =>
                array (
                'race_result_id' => 1161,
                'time_ms' => 85713,
                'position' => 40,
                ),
                40 =>
                array (
                'race_result_id' => 1172,
                'time_ms' => 85876,
                'position' => 41,
                ),
                41 =>
                array (
                'race_result_id' => 1162,
                'time_ms' => 86066,
                'position' => 42,
                ),
                42 =>
                array (
                'race_result_id' => 1173,
                'time_ms' => 86560,
                'position' => 43,
                ),
                43 =>
                array (
                'race_result_id' => 1174,
                'time_ms' => 86567,
                'position' => 44,
                ),
                44 =>
                array (
                'race_result_id' => 1175,
                'time_ms' => 87067,
                'position' => 45,
                ),
                45 =>
                array (
                'race_result_id' => 1176,
                'time_ms' => 88414,
                'position' => 46,
                ),
                )),
                'race_time_results' => json_encode(array (
        0 =>
        array (
        'race_result_id' => 325,
        'time_ms' => 733589,
        'position' => 1,
                ),
                1 =>
                array (
                'race_result_id' => 326,
                'time_ms' => 738620,
                'position' => 2,
                ),
                2 =>
                array (
                'race_result_id' => 327,
                'time_ms' => 738955,
                'position' => 3,
                ),
                3 =>
                array (
                'race_result_id' => 328,
                'time_ms' => 743066,
                'position' => 4,
                ),
                4 =>
                array (
                'race_result_id' => 329,
                'time_ms' => 744656,
                'position' => 5,
                ),
                5 =>
                array (
                'race_result_id' => 331,
                'time_ms' => 745912,
                'position' => 6,
                ),
                6 =>
                array (
                'race_result_id' => 332,
                'time_ms' => 746920,
                'position' => 7,
                ),
                7 =>
                array (
                'race_result_id' => 427,
                'time_ms' => 747691,
                'position' => 8,
                ),
                8 =>
                array (
                'race_result_id' => 330,
                'time_ms' => 749667,
                'position' => 9,
                ),
                9 =>
                array (
                'race_result_id' => 428,
                'time_ms' => 752602,
                'position' => 10,
                ),
                10 =>
                array (
                'race_result_id' => 1208,
                'time_ms' => 752947,
                'position' => 11,
                ),
                11 =>
                array (
                'race_result_id' => 1221,
                'time_ms' => 753756,
                'position' => 12,
                ),
                12 =>
                array (
                'race_result_id' => 430,
                'time_ms' => 753785,
                'position' => 13,
                ),
                13 =>
                array (
                'race_result_id' => 431,
                'time_ms' => 755905,
                'position' => 14,
                ),
                14 =>
                array (
                'race_result_id' => 1210,
                'time_ms' => 756207,
                'position' => 15,
                ),
                15 =>
                array (
                'race_result_id' => 333,
                'time_ms' => 756257,
                'position' => 16,
                ),
                16 =>
                array (
                'race_result_id' => 433,
                'time_ms' => 757693,
                'position' => 17,
                ),
                17 =>
                array (
                'race_result_id' => 1222,
                'time_ms' => 757997,
                'position' => 18,
                ),
                18 =>
                array (
                'race_result_id' => 1223,
                'time_ms' => 762188,
                'position' => 19,
                ),
                19 =>
                array (
                'race_result_id' => 347,
                'time_ms' => 762464,
                'position' => 20,
                ),
                20 =>
                array (
                'race_result_id' => 1193,
                'time_ms' => 762566,
                'position' => 21,
                ),
                21 =>
                array (
                'race_result_id' => 434,
                'time_ms' => 763109,
                'position' => 22,
                ),
                22 =>
                array (
                'race_result_id' => 1225,
                'time_ms' => 763771,
                'position' => 23,
                ),
                23 =>
                array (
                'race_result_id' => 435,
                'time_ms' => 763994,
                'position' => 24,
                ),
                24 =>
                array (
                'race_result_id' => 1194,
                'time_ms' => 764568,
                'position' => 25,
                ),
                25 =>
                array (
                'race_result_id' => 338,
                'time_ms' => 765464,
                'position' => 26,
                ),
                26 =>
                array (
                'race_result_id' => 436,
                'time_ms' => 765679,
                'position' => 27,
                ),
                27 =>
                array (
                'race_result_id' => 348,
                'time_ms' => 765816,
                'position' => 28,
                ),
                28 =>
                array (
                'race_result_id' => 437,
                'time_ms' => 766760,
                'position' => 29,
                ),
                29 =>
                array (
                'race_result_id' => 1195,
                'time_ms' => 767725,
                'position' => 30,
                ),
                30 =>
                array (
                'race_result_id' => 438,
                'time_ms' => 769506,
                'position' => 31,
                ),
                31 =>
                array (
                'race_result_id' => 1227,
                'time_ms' => 771287,
                'position' => 32,
                ),
                32 =>
                array (
                'race_result_id' => 1228,
                'time_ms' => 772131,
                'position' => 33,
                ),
                33 =>
                array (
                'race_result_id' => 1198,
                'time_ms' => 776191,
                'position' => 34,
                ),
                34 =>
                array (
                'race_result_id' => 339,
                'time_ms' => 776857,
                'position' => 35,
                ),
                35 =>
                array (
                'race_result_id' => 1229,
                'time_ms' => 777189,
                'position' => 36,
                ),
                36 =>
                array (
                'race_result_id' => 1230,
                'time_ms' => 778631,
                'position' => 37,
                ),
                37 =>
                array (
                'race_result_id' => 341,
                'time_ms' => 778761,
                'position' => 38,
                ),
                38 =>
                array (
                'race_result_id' => 353,
                'time_ms' => 779042,
                'position' => 39,
                ),
                39 =>
                array (
                'race_result_id' => 1199,
                'time_ms' => 780686,
                'position' => 40,
                ),
                40 =>
                array (
                'race_result_id' => 1200,
                'time_ms' => 783232,
                'position' => 41,
                ),
                41 =>
                array (
                'race_result_id' => 1233,
                'time_ms' => 784566,
                'position' => 42,
                ),
                42 =>
                array (
                'race_result_id' => 343,
                'time_ms' => 785927,
                'position' => 43,
                ),
                43 =>
                array (
                'race_result_id' => 354,
                'time_ms' => 788706,
                'position' => 44,
                ),
                44 =>
                array (
                'race_result_id' => 356,
                'time_ms' => 790784,
                'position' => 45,
                ),
                45 =>
                array (
                'race_result_id' => 1203,
                'time_ms' => 798458,
                'position' => 46,
                ),
                46 =>
                array (
                'race_result_id' => 358,
                'time_ms' => 798617,
                'position' => 47,
                ),
                47 =>
                array (
                'race_result_id' => 1205,
                'time_ms' => 803180,
                'position' => 48,
                ),
                )),
                'fastest_lap_results' => json_encode(array (
        0 =>
        array (
        'race_result_id' => 325,
        'time_ms' => 80395,
        'position' => 1,
                ),
                1 =>
                array (
                'race_result_id' => 327,
                'time_ms' => 80897,
                'position' => 2,
                ),
                2 =>
                array (
                'race_result_id' => 1189,
                'time_ms' => 80938,
                'position' => 3,
                ),
                3 =>
                array (
                'race_result_id' => 1190,
                'time_ms' => 80939,
                'position' => 4,
                ),
                4 =>
                array (
                'race_result_id' => 329,
                'time_ms' => 81179,
                'position' => 5,
                ),
                5 =>
                array (
                'race_result_id' => 1219,
                'time_ms' => 81502,
                'position' => 6,
                ),
                6 =>
                array (
                'race_result_id' => 332,
                'time_ms' => 81590,
                'position' => 7,
                ),
                7 =>
                array (
                'race_result_id' => 1208,
                'time_ms' => 81674,
                'position' => 8,
                ),
                8 =>
                array (
                'race_result_id' => 1207,
                'time_ms' => 81696,
                'position' => 9,
                ),
                9 =>
                array (
                'race_result_id' => 431,
                'time_ms' => 81783,
                'position' => 10,
                ),
                10 =>
                array (
                'race_result_id' => 426,
                'time_ms' => 81882,
                'position' => 11,
                ),
                11 =>
                array (
                'race_result_id' => 1224,
                'time_ms' => 82067,
                'position' => 12,
                ),
                12 =>
                array (
                'race_result_id' => 1225,
                'time_ms' => 82143,
                'position' => 13,
                ),
                13 =>
                array (
                'race_result_id' => 428,
                'time_ms' => 82160,
                'position' => 14,
                ),
                14 =>
                array (
                'race_result_id' => 1222,
                'time_ms' => 82240,
                'position' => 15,
                ),
                15 =>
                array (
                'race_result_id' => 338,
                'time_ms' => 82263,
                'position' => 16,
                ),
                16 =>
                array (
                'race_result_id' => 432,
                'time_ms' => 82279,
                'position' => 17,
                ),
                17 =>
                array (
                'race_result_id' => 430,
                'time_ms' => 82301,
                'position' => 18,
                ),
                18 =>
                array (
                'race_result_id' => 1221,
                'time_ms' => 82377,
                'position' => 19,
                ),
                19 =>
                array (
                'race_result_id' => 433,
                'time_ms' => 82377,
                'position' => 20,
                ),
                20 =>
                array (
                'race_result_id' => 337,
                'time_ms' => 82569,
                'position' => 21,
                ),
                21 =>
                array (
                'race_result_id' => 1193,
                'time_ms' => 82704,
                'position' => 22,
                ),
                22 =>
                array (
                'race_result_id' => 434,
                'time_ms' => 82788,
                'position' => 23,
                ),
                23 =>
                array (
                'race_result_id' => 435,
                'time_ms' => 82823,
                'position' => 24,
                ),
                24 =>
                array (
                'race_result_id' => 450,
                'time_ms' => 82843,
                'position' => 25,
                ),
                25 =>
                array (
                'race_result_id' => 436,
                'time_ms' => 82847,
                'position' => 26,
                ),
                26 =>
                array (
                'race_result_id' => 367,
                'time_ms' => 82853,
                'position' => 27,
                ),
                27 =>
                array (
                'race_result_id' => 347,
                'time_ms' => 82926,
                'position' => 28,
                ),
                28 =>
                array (
                'race_result_id' => 352,
                'time_ms' => 82974,
                'position' => 29,
                ),
                29 =>
                array (
                'race_result_id' => 350,
                'time_ms' => 83125,
                'position' => 30,
                ),
                30 =>
                array (
                'race_result_id' => 1230,
                'time_ms' => 83131,
                'position' => 31,
                ),
                31 =>
                array (
                'race_result_id' => 353,
                'time_ms' => 83162,
                'position' => 32,
                ),
                32 =>
                array (
                'race_result_id' => 341,
                'time_ms' => 83168,
                'position' => 33,
                ),
                33 =>
                array (
                'race_result_id' => 437,
                'time_ms' => 83237,
                'position' => 34,
                ),
                34 =>
                array (
                'race_result_id' => 456,
                'time_ms' => 83269,
                'position' => 35,
                ),
                35 =>
                array (
                'race_result_id' => 1229,
                'time_ms' => 83305,
                'position' => 36,
                ),
                36 =>
                array (
                'race_result_id' => 1227,
                'time_ms' => 83394,
                'position' => 37,
                ),
                37 =>
                array (
                'race_result_id' => 348,
                'time_ms' => 83469,
                'position' => 38,
                ),
                38 =>
                array (
                'race_result_id' => 462,
                'time_ms' => 84008,
                'position' => 39,
                ),
                39 =>
                array (
                'race_result_id' => 449,
                'time_ms' => 84019,
                'position' => 40,
                ),
                40 =>
                array (
                'race_result_id' => 1233,
                'time_ms' => 84225,
                'position' => 41,
                ),
                41 =>
                array (
                'race_result_id' => 1199,
                'time_ms' => 84372,
                'position' => 42,
                ),
                42 =>
                array (
                'race_result_id' => 343,
                'time_ms' => 84656,
                'position' => 43,
                ),
                43 =>
                array (
                'race_result_id' => 356,
                'time_ms' => 85292,
                'position' => 44,
                ),
                44 =>
                array (
                'race_result_id' => 354,
                'time_ms' => 85496,
                'position' => 45,
                ),
                45 =>
                array (
                'race_result_id' => 359,
                'time_ms' => 85755,
                'position' => 46,
                ),
                46 =>
                array (
                'race_result_id' => 358,
                'time_ms' => 86079,
                'position' => 47,
                ),
                47 =>
                array (
                'race_result_id' => 360,
                'time_ms' => 86323,
                'position' => 48,
                ),
                )),
                'created_by_user_id' => 1,
                'created_at' => '2025-11-27 11:25:50',
                'updated_at' => '2025-12-31 02:51:52',
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
                'points_system' => json_encode(array (
            1 => 25,
            2 => 20,
            3 => 16,
            4 => 13,
            5 => 11,
            6 => 10,
            7 => 9,
            8 => 8,
            9 => 7,
            10 => 6,
            11 => 5,
            12 => 4,
            13 => 3,
            14 => 2,
            15 => 1,
            16 => 0,
                )),
                'round_points' => true,
                'status' => 'completed',
                'round_results' => json_encode(array (
        'standings' =>
        array (
        0 =>
        array (
        'division_id' => 1,
        'division_name' => 'Division 1',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 48,
          'driver_name' => 'MINT_Matt',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 1,
          'round_points' => 25,
          'total_points' => 26,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 76,
          'driver_name' => 'warrior2167',
          'race_points' => 0,
          'fastest_lap_points' => 1,
          'pole_position_points' => 0,
          'round_points' => 20,
          'total_points' => 21,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 54,
          'driver_name' => 'Rangeraus',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 16,
          'total_points' => 16,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 52,
          'driver_name' => 'pokeeetus',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 13,
          'total_positions_gained' => -2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        4 =>
        array (
          'position' => 5,
          'driver_id' => 38,
          'driver_name' => 'JimothyPayload',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 11,
          'total_points' => 11,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        5 =>
        array (
          'position' => 6,
          'driver_id' => 75,
          'driver_name' => 'Viperzed',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 10,
          'total_points' => 10,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        6 =>
        array (
          'position' => 7,
          'driver_id' => 82,
          'driver_name' => 'BlockyRex1',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 9,
          'total_points' => 9,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        7 =>
        array (
          'position' => 8,
          'driver_id' => 63,
          'driver_name' => 'sidawg2',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 8,
          'total_points' => 8,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        ),
        ),
        1 =>
        array (
        'division_id' => 4,
        'division_name' => 'Division 4',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 31,
          'driver_name' => 'Hatchy3_',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 25,
          'total_points' => 25,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 43,
          'driver_name' => 'Kiwi_kart_racer9',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 20,
          'total_points' => 20,
          'total_positions_gained' => 6,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 5,
          'driver_name' => 'AverageDad',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 16,
          'total_points' => 16,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 74,
          'driver_name' => 'Vert Wheeler',
          'race_points' => 0,
          'fastest_lap_points' => 1,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 14,
          'total_positions_gained' => 7,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        4 =>
        array (
          'position' => 5,
          'driver_id' => 12,
          'driver_name' => 'Bluntman75',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 11,
          'total_points' => 11,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        5 =>
        array (
          'position' => 6,
          'driver_id' => 34,
          'driver_name' => 'j. Farley',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 10,
          'total_points' => 10,
          'total_positions_gained' => -2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        6 =>
        array (
          'position' => 7,
          'driver_id' => 27,
          'driver_name' => 'Easyprey007',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 9,
          'total_points' => 9,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        7 =>
        array (
          'position' => 8,
          'driver_id' => 35,
          'driver_name' => 'J.Nightingale',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 8,
          'total_points' => 8,
          'total_positions_gained' => 6,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        8 =>
        array (
          'position' => 9,
          'driver_id' => 50,
          'driver_name' => 'Natalie WA',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 7,
          'total_points' => 7,
          'total_positions_gained' => -3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        9 =>
        array (
          'position' => 10,
          'driver_id' => 3,
          'driver_name' => 'arnoldwa',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 6,
          'total_points' => 6,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        10 =>
        array (
          'position' => 11,
          'driver_id' => 49,
          'driver_name' => 'Muzzie_013',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 1,
          'round_points' => 5,
          'total_points' => 6,
          'total_positions_gained' => -10,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        11 =>
        array (
          'position' => 12,
          'driver_id' => 45,
          'driver_name' => 'Luppo',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 4,
          'total_points' => 4,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        12 =>
        array (
          'position' => 13,
          'driver_id' => 36,
          'driver_name' => 'JC_Blaize',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 3,
          'total_points' => 3,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        13 =>
        array (
          'position' => 14,
          'driver_id' => 62,
          'driver_name' => 'seowster',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 2,
          'total_points' => 2,
          'total_positions_gained' => -5,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        14 =>
        array (
          'position' => 15,
          'driver_id' => 78,
          'driver_name' => 'Wolfy 1961',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 1,
          'total_points' => 1,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        ),
        ),
        2 =>
        array (
        'division_id' => 3,
        'division_name' => 'Division 3',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 20,
          'driver_name' => 'Dash_Vanguard',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 25,
          'total_points' => 25,
          'total_positions_gained' => 4,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 22,
          'driver_name' => 'Donsflyup',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 1,
          'round_points' => 20,
          'total_points' => 21,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 58,
          'driver_name' => 'Savage_Duck_75',
          'race_points' => 0,
          'fastest_lap_points' => 1,
          'pole_position_points' => 0,
          'round_points' => 16,
          'total_points' => 17,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 30,
          'driver_name' => 'Half-Byte',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 13,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        4 =>
        array (
          'position' => 5,
          'driver_id' => 79,
          'driver_name' => 'X-3vi1 m00n',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 11,
          'total_points' => 11,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        5 =>
        array (
          'position' => 6,
          'driver_id' => 68,
          'driver_name' => 'Sylveon with a gun',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 10,
          'total_points' => 10,
          'total_positions_gained' => 3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        6 =>
        array (
          'position' => 7,
          'driver_id' => 72,
          'driver_name' => 'tolley_',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 9,
          'total_points' => 9,
          'total_positions_gained' => 7,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        7 =>
        array (
          'position' => 8,
          'driver_id' => 2,
          'driver_name' => 'anders_race',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 8,
          'total_points' => 8,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        8 =>
        array (
          'position' => 9,
          'driver_id' => 51,
          'driver_name' => 'Ozglenn',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 7,
          'total_points' => 7,
          'total_positions_gained' => 6,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        9 =>
        array (
          'position' => 10,
          'driver_id' => 70,
          'driver_name' => 'T-GT Racing',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 6,
          'total_points' => 6,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        10 =>
        array (
          'position' => 11,
          'driver_id' => 69,
          'driver_name' => 'T F Eccles',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 5,
          'total_points' => 5,
          'total_positions_gained' => -9,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        11 =>
        array (
          'position' => 12,
          'driver_id' => 59,
          'driver_name' => 'Schumojo 13',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 4,
          'total_points' => 4,
          'total_positions_gained' => -9,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        12 =>
        array (
          'position' => 13,
          'driver_id' => 55,
          'driver_name' => 'RBRHoges97',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 3,
          'total_points' => 3,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        13 =>
        array (
          'position' => 14,
          'driver_id' => 9,
          'driver_name' => 'Beats',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 2,
          'total_points' => 2,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        14 =>
        array (
          'position' => 15,
          'driver_id' => 66,
          'driver_name' => 'Steve_73_GOOF',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 0,
          'total_points' => 0,
          'total_positions_gained' => 0,
          'has_any_dnf' => true,
          'should_receive_zero_points' => true,
          'total_penalties' => '0.000',
        ),
        ),
        ),
        3 =>
        array (
        'division_id' => 2,
        'division_name' => 'Division 2',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 65,
          'driver_name' => 'Snorxal',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 25,
          'total_points' => 25,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '5.000',
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 47,
          'driver_name' => 'Matthyus',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 20,
          'total_points' => 20,
          'total_positions_gained' => 8,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 73,
          'driver_name' => 'UrsineSaturn9',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 1,
          'round_points' => 16,
          'total_points' => 17,
          'total_positions_gained' => -2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 26,
          'driver_name' => 'E. Presley',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 13,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        4 =>
        array (
          'position' => 5,
          'driver_id' => 6,
          'driver_name' => 'B. CakePie',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 11,
          'total_points' => 11,
          'total_positions_gained' => 3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        5 =>
        array (
          'position' => 6,
          'driver_id' => 60,
          'driver_name' => 'Selduin',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 10,
          'total_points' => 10,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        6 =>
        array (
          'position' => 7,
          'driver_id' => 81,
          'driver_name' => 'TimAnt_46',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 9,
          'total_points' => 9,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        7 =>
        array (
          'position' => 8,
          'driver_id' => 1,
          'driver_name' => 'Alexb8891',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 8,
          'total_points' => 8,
          'total_positions_gained' => -6,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        8 =>
        array (
          'position' => 9,
          'driver_id' => 37,
          'driver_name' => 'Jelly Mechanic',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 7,
          'total_points' => 7,
          'total_positions_gained' => -6,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        9 =>
        array (
          'position' => 10,
          'driver_id' => 77,
          'driver_name' => 'Whizz94',
          'race_points' => 0,
          'fastest_lap_points' => 1,
          'pole_position_points' => 0,
          'round_points' => 6,
          'total_points' => 7,
          'total_positions_gained' => -3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '5.000',
        ),
        10 =>
        array (
          'position' => 11,
          'driver_id' => 67,
          'driver_name' => 'Stinky',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 5,
          'total_points' => 5,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        11 =>
        array (
          'position' => 12,
          'driver_id' => 40,
          'driver_name' => 'K. Brown',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 4,
          'total_points' => 4,
          'total_positions_gained' => -3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        12 =>
        array (
          'position' => 13,
          'driver_id' => 15,
          'driver_name' => 'btwong',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 3,
          'total_points' => 3,
          'total_positions_gained' => -2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        ),
        ),
                ),
                )),
                'qualifying_results' => json_encode(array (
        0 =>
        array (
        'race_result_id' => 469,
        'time_ms' => 88515,
        'position' => 1,
                ),
                1 =>
                array (
                'race_result_id' => 470,
                'time_ms' => 88543,
                'position' => 2,
                ),
                2 =>
                array (
                'race_result_id' => 471,
                'time_ms' => 88676,
                'position' => 3,
                ),
                3 =>
                array (
                'race_result_id' => 472,
                'time_ms' => 88877,
                'position' => 4,
                ),
                4 =>
                array (
                'race_result_id' => 473,
                'time_ms' => 89043,
                'position' => 5,
                ),
                5 =>
                array (
                'race_result_id' => 474,
                'time_ms' => 89169,
                'position' => 6,
                ),
                6 =>
                array (
                'race_result_id' => 475,
                'time_ms' => 89193,
                'position' => 7,
                ),
                7 =>
                array (
                'race_result_id' => 477,
                'time_ms' => 89436,
                'position' => 8,
                ),
                8 =>
                array (
                'race_result_id' => 478,
                'time_ms' => 89581,
                'position' => 9,
                ),
                9 =>
                array (
                'race_result_id' => 479,
                'time_ms' => 89606,
                'position' => 10,
                ),
                10 =>
                array (
                'race_result_id' => 480,
                'time_ms' => 89610,
                'position' => 11,
                ),
                11 =>
                array (
                'race_result_id' => 476,
                'time_ms' => 89655,
                'position' => 12,
                ),
                12 =>
                array (
                'race_result_id' => 481,
                'time_ms' => 89695,
                'position' => 13,
                ),
                13 =>
                array (
                'race_result_id' => 489,
                'time_ms' => 89813,
                'position' => 14,
                ),
                14 =>
                array (
                'race_result_id' => 482,
                'time_ms' => 89845,
                'position' => 15,
                ),
                15 =>
                array (
                'race_result_id' => 504,
                'time_ms' => 89864,
                'position' => 16,
                ),
                16 =>
                array (
                'race_result_id' => 483,
                'time_ms' => 89950,
                'position' => 17,
                ),
                17 =>
                array (
                'race_result_id' => 490,
                'time_ms' => 90062,
                'position' => 18,
                ),
                18 =>
                array (
                'race_result_id' => 505,
                'time_ms' => 90087,
                'position' => 19,
                ),
                19 =>
                array (
                'race_result_id' => 506,
                'time_ms' => 90095,
                'position' => 20,
                ),
                20 =>
                array (
                'race_result_id' => 507,
                'time_ms' => 90104,
                'position' => 21,
                ),
                21 =>
                array (
                'race_result_id' => 508,
                'time_ms' => 90136,
                'position' => 22,
                ),
                22 =>
                array (
                'race_result_id' => 509,
                'time_ms' => 90145,
                'position' => 23,
                ),
                23 =>
                array (
                'race_result_id' => 491,
                'time_ms' => 90151,
                'position' => 24,
                ),
                24 =>
                array (
                'race_result_id' => 484,
                'time_ms' => 90170,
                'position' => 25,
                ),
                25 =>
                array (
                'race_result_id' => 492,
                'time_ms' => 90183,
                'position' => 26,
                ),
                26 =>
                array (
                'race_result_id' => 510,
                'time_ms' => 90195,
                'position' => 27,
                ),
                27 =>
                array (
                'race_result_id' => 485,
                'time_ms' => 90309,
                'position' => 28,
                ),
                28 =>
                array (
                'race_result_id' => 486,
                'time_ms' => 90314,
                'position' => 29,
                ),
                29 =>
                array (
                'race_result_id' => 511,
                'time_ms' => 90339,
                'position' => 30,
                ),
                30 =>
                array (
                'race_result_id' => 512,
                'time_ms' => 90387,
                'position' => 31,
                ),
                31 =>
                array (
                'race_result_id' => 513,
                'time_ms' => 90429,
                'position' => 32,
                ),
                32 =>
                array (
                'race_result_id' => 514,
                'time_ms' => 90434,
                'position' => 33,
                ),
                33 =>
                array (
                'race_result_id' => 493,
                'time_ms' => 90530,
                'position' => 34,
                ),
                34 =>
                array (
                'race_result_id' => 494,
                'time_ms' => 90596,
                'position' => 35,
                ),
                35 =>
                array (
                'race_result_id' => 515,
                'time_ms' => 90612,
                'position' => 36,
                ),
                36 =>
                array (
                'race_result_id' => 487,
                'time_ms' => 90742,
                'position' => 37,
                ),
                37 =>
                array (
                'race_result_id' => 488,
                'time_ms' => 90758,
                'position' => 38,
                ),
                38 =>
                array (
                'race_result_id' => 516,
                'time_ms' => 90802,
                'position' => 39,
                ),
                39 =>
                array (
                'race_result_id' => 495,
                'time_ms' => 90918,
                'position' => 40,
                ),
                40 =>
                array (
                'race_result_id' => 496,
                'time_ms' => 91055,
                'position' => 41,
                ),
                41 =>
                array (
                'race_result_id' => 517,
                'time_ms' => 91105,
                'position' => 42,
                ),
                42 =>
                array (
                'race_result_id' => 497,
                'time_ms' => 91108,
                'position' => 43,
                ),
                43 =>
                array (
                'race_result_id' => 518,
                'time_ms' => 91109,
                'position' => 44,
                ),
                44 =>
                array (
                'race_result_id' => 498,
                'time_ms' => 91254,
                'position' => 45,
                ),
                45 =>
                array (
                'race_result_id' => 499,
                'time_ms' => 91309,
                'position' => 46,
                ),
                46 =>
                array (
                'race_result_id' => 500,
                'time_ms' => 91663,
                'position' => 47,
                ),
                47 =>
                array (
                'race_result_id' => 501,
                'time_ms' => 91982,
                'position' => 48,
                ),
                48 =>
                array (
                'race_result_id' => 502,
                'time_ms' => 92069,
                'position' => 49,
                ),
                49 =>
                array (
                'race_result_id' => 503,
                'time_ms' => 92995,
                'position' => 50,
                ),
                )),
                'race_time_results' => json_encode(array (
        0 =>
        array (
        'race_result_id' => 621,
        'time_ms' => 2615117,
        'position' => 1,
                ),
                1 =>
                array (
                'race_result_id' => 622,
                'time_ms' => 2618185,
                'position' => 2,
                ),
                2 =>
                array (
                'race_result_id' => 623,
                'time_ms' => 2618651,
                'position' => 3,
                ),
                3 =>
                array (
                'race_result_id' => 624,
                'time_ms' => 2628585,
                'position' => 4,
                ),
                4 =>
                array (
                'race_result_id' => 625,
                'time_ms' => 2638217,
                'position' => 5,
                ),
                5 =>
                array (
                'race_result_id' => 626,
                'time_ms' => 2639180,
                'position' => 6,
                ),
                6 =>
                array (
                'race_result_id' => 627,
                'time_ms' => 2653646,
                'position' => 7,
                ),
                7 =>
                array (
                'race_result_id' => 657,
                'time_ms' => 2658843,
                'position' => 8,
                ),
                8 =>
                array (
                'race_result_id' => 644,
                'time_ms' => 2659170,
                'position' => 9,
                ),
                9 =>
                array (
                'race_result_id' => 645,
                'time_ms' => 2659574,
                'position' => 10,
                ),
                10 =>
                array (
                'race_result_id' => 646,
                'time_ms' => 2660122,
                'position' => 11,
                ),
                11 =>
                array (
                'race_result_id' => 658,
                'time_ms' => 2660966,
                'position' => 12,
                ),
                12 =>
                array (
                'race_result_id' => 647,
                'time_ms' => 2668330,
                'position' => 13,
                ),
                13 =>
                array (
                'race_result_id' => 648,
                'time_ms' => 2668331,
                'position' => 14,
                ),
                14 =>
                array (
                'race_result_id' => 659,
                'time_ms' => 2672701,
                'position' => 15,
                ),
                15 =>
                array (
                'race_result_id' => 660,
                'time_ms' => 2672783,
                'position' => 16,
                ),
                16 =>
                array (
                'race_result_id' => 649,
                'time_ms' => 2672793,
                'position' => 17,
                ),
                17 =>
                array (
                'race_result_id' => 661,
                'time_ms' => 2673171,
                'position' => 18,
                ),
                18 =>
                array (
                'race_result_id' => 662,
                'time_ms' => 2675479,
                'position' => 19,
                ),
                19 =>
                array (
                'race_result_id' => 663,
                'time_ms' => 2680292,
                'position' => 20,
                ),
                20 =>
                array (
                'race_result_id' => 650,
                'time_ms' => 2682831,
                'position' => 21,
                ),
                21 =>
                array (
                'race_result_id' => 629,
                'time_ms' => 2687847,
                'position' => 22,
                ),
                22 =>
                array (
                'race_result_id' => 664,
                'time_ms' => 2691049,
                'position' => 23,
                ),
                23 =>
                array (
                'race_result_id' => 665,
                'time_ms' => 2691181,
                'position' => 24,
                ),
                24 =>
                array (
                'race_result_id' => 666,
                'time_ms' => 2693238,
                'position' => 25,
                ),
                25 =>
                array (
                'race_result_id' => 652,
                'time_ms' => 2694617,
                'position' => 26,
                ),
                26 =>
                array (
                'race_result_id' => 667,
                'time_ms' => 2694994,
                'position' => 27,
                ),
                27 =>
                array (
                'race_result_id' => 653,
                'time_ms' => 2695027,
                'position' => 28,
                ),
                28 =>
                array (
                'race_result_id' => 651,
                'time_ms' => 2695548,
                'position' => 29,
                ),
                29 =>
                array (
                'race_result_id' => 668,
                'time_ms' => 2696837,
                'position' => 30,
                ),
                30 =>
                array (
                'race_result_id' => 654,
                'time_ms' => 2699369,
                'position' => 31,
                ),
                31 =>
                array (
                'race_result_id' => 630,
                'time_ms' => 2701026,
                'position' => 32,
                ),
                32 =>
                array (
                'race_result_id' => 631,
                'time_ms' => 2702210,
                'position' => 33,
                ),
                33 =>
                array (
                'race_result_id' => 628,
                'time_ms' => 2703600,
                'position' => 34,
                ),
                34 =>
                array (
                'race_result_id' => 655,
                'time_ms' => 2711430,
                'position' => 35,
                ),
                35 =>
                array (
                'race_result_id' => 669,
                'time_ms' => 2711686,
                'position' => 36,
                ),
                36 =>
                array (
                'race_result_id' => 656,
                'time_ms' => 2713968,
                'position' => 37,
                ),
                37 =>
                array (
                'race_result_id' => 632,
                'time_ms' => 2716628,
                'position' => 38,
                ),
                38 =>
                array (
                'race_result_id' => 633,
                'time_ms' => 2719379,
                'position' => 39,
                ),
                39 =>
                array (
                'race_result_id' => 634,
                'time_ms' => 2728681,
                'position' => 40,
                ),
                40 =>
                array (
                'race_result_id' => 635,
                'time_ms' => 2732356,
                'position' => 41,
                ),
                41 =>
                array (
                'race_result_id' => 636,
                'time_ms' => 2737631,
                'position' => 42,
                ),
                42 =>
                array (
                'race_result_id' => 637,
                'time_ms' => 2740905,
                'position' => 43,
                ),
                43 =>
                array (
                'race_result_id' => 638,
                'time_ms' => 2745782,
                'position' => 44,
                ),
                44 =>
                array (
                'race_result_id' => 639,
                'time_ms' => 2747615,
                'position' => 45,
                ),
                45 =>
                array (
                'race_result_id' => 670,
                'time_ms' => 2749100,
                'position' => 46,
                ),
                46 =>
                array (
                'race_result_id' => 640,
                'time_ms' => 2749707,
                'position' => 47,
                ),
                47 =>
                array (
                'race_result_id' => 641,
                'time_ms' => 2766519,
                'position' => 48,
                ),
                48 =>
                array (
                'race_result_id' => 642,
                'time_ms' => 2770510,
                'position' => 49,
                ),
                49 =>
                array (
                'race_result_id' => 643,
                'time_ms' => 2876847,
                'position' => 50,
                ),
                )),
                'fastest_lap_results' => json_encode(array (
        0 =>
        array (
        'race_result_id' => 622,
        'time_ms' => 88251,
        'position' => 1,
                ),
                1 =>
                array (
                'race_result_id' => 628,
                'time_ms' => 88483,
                'position' => 2,
                ),
                2 =>
                array (
                'race_result_id' => 621,
                'time_ms' => 88495,
                'position' => 3,
                ),
                3 =>
                array (
                'race_result_id' => 623,
                'time_ms' => 88562,
                'position' => 4,
                ),
                4 =>
                array (
                'race_result_id' => 624,
                'time_ms' => 88689,
                'position' => 5,
                ),
                5 =>
                array (
                'race_result_id' => 625,
                'time_ms' => 88714,
                'position' => 6,
                ),
                6 =>
                array (
                'race_result_id' => 626,
                'time_ms' => 88869,
                'position' => 7,
                ),
                7 =>
                array (
                'race_result_id' => 651,
                'time_ms' => 89169,
                'position' => 8,
                ),
                8 =>
                array (
                'race_result_id' => 627,
                'time_ms' => 89220,
                'position' => 9,
                ),
                9 =>
                array (
                'race_result_id' => 649,
                'time_ms' => 89313,
                'position' => 10,
                ),
                10 =>
                array (
                'race_result_id' => 647,
                'time_ms' => 89314,
                'position' => 11,
                ),
                11 =>
                array (
                'race_result_id' => 659,
                'time_ms' => 89335,
                'position' => 12,
                ),
                12 =>
                array (
                'race_result_id' => 648,
                'time_ms' => 89462,
                'position' => 13,
                ),
                13 =>
                array (
                'race_result_id' => 645,
                'time_ms' => 89467,
                'position' => 14,
                ),
                14 =>
                array (
                'race_result_id' => 644,
                'time_ms' => 89468,
                'position' => 15,
                ),
                15 =>
                array (
                'race_result_id' => 661,
                'time_ms' => 89487,
                'position' => 16,
                ),
                16 =>
                array (
                'race_result_id' => 662,
                'time_ms' => 89498,
                'position' => 17,
                ),
                17 =>
                array (
                'race_result_id' => 658,
                'time_ms' => 89535,
                'position' => 18,
                ),
                18 =>
                array (
                'race_result_id' => 653,
                'time_ms' => 89597,
                'position' => 19,
                ),
                19 =>
                array (
                'race_result_id' => 665,
                'time_ms' => 89609,
                'position' => 20,
                ),
                20 =>
                array (
                'race_result_id' => 646,
                'time_ms' => 89624,
                'position' => 21,
                ),
                21 =>
                array (
                'race_result_id' => 652,
                'time_ms' => 89644,
                'position' => 22,
                ),
                22 =>
                array (
                'race_result_id' => 657,
                'time_ms' => 89705,
                'position' => 23,
                ),
                23 =>
                array (
                'race_result_id' => 650,
                'time_ms' => 89717,
                'position' => 24,
                ),
                24 =>
                array (
                'race_result_id' => 663,
                'time_ms' => 89774,
                'position' => 25,
                ),
                25 =>
                array (
                'race_result_id' => 668,
                'time_ms' => 89878,
                'position' => 26,
                ),
                26 =>
                array (
                'race_result_id' => 656,
                'time_ms' => 89938,
                'position' => 27,
                ),
                27 =>
                array (
                'race_result_id' => 664,
                'time_ms' => 89977,
                'position' => 28,
                ),
                28 =>
                array (
                'race_result_id' => 660,
                'time_ms' => 89985,
                'position' => 29,
                ),
                29 =>
                array (
                'race_result_id' => 666,
                'time_ms' => 90050,
                'position' => 30,
                ),
                30 =>
                array (
                'race_result_id' => 655,
                'time_ms' => 90092,
                'position' => 31,
                ),
                31 =>
                array (
                'race_result_id' => 667,
                'time_ms' => 90167,
                'position' => 32,
                ),
                32 =>
                array (
                'race_result_id' => 654,
                'time_ms' => 90171,
                'position' => 33,
                ),
                33 =>
                array (
                'race_result_id' => 632,
                'time_ms' => 90215,
                'position' => 34,
                ),
                34 =>
                array (
                'race_result_id' => 670,
                'time_ms' => 90257,
                'position' => 35,
                ),
                35 =>
                array (
                'race_result_id' => 631,
                'time_ms' => 90261,
                'position' => 36,
                ),
                36 =>
                array (
                'race_result_id' => 630,
                'time_ms' => 90376,
                'position' => 37,
                ),
                37 =>
                array (
                'race_result_id' => 629,
                'time_ms' => 90485,
                'position' => 38,
                ),
                38 =>
                array (
                'race_result_id' => 669,
                'time_ms' => 90485,
                'position' => 39,
                ),
                39 =>
                array (
                'race_result_id' => 671,
                'time_ms' => 90503,
                'position' => 40,
                ),
                40 =>
                array (
                'race_result_id' => 639,
                'time_ms' => 90615,
                'position' => 41,
                ),
                41 =>
                array (
                'race_result_id' => 635,
                'time_ms' => 90716,
                'position' => 42,
                ),
                42 =>
                array (
                'race_result_id' => 637,
                'time_ms' => 90795,
                'position' => 43,
                ),
                43 =>
                array (
                'race_result_id' => 634,
                'time_ms' => 90838,
                'position' => 44,
                ),
                44 =>
                array (
                'race_result_id' => 633,
                'time_ms' => 90859,
                'position' => 45,
                ),
                45 =>
                array (
                'race_result_id' => 642,
                'time_ms' => 90887,
                'position' => 46,
                ),
                46 =>
                array (
                'race_result_id' => 636,
                'time_ms' => 91256,
                'position' => 47,
                ),
                47 =>
                array (
                'race_result_id' => 640,
                'time_ms' => 91461,
                'position' => 48,
                ),
                48 =>
                array (
                'race_result_id' => 641,
                'time_ms' => 91505,
                'position' => 49,
                ),
                49 =>
                array (
                'race_result_id' => 638,
                'time_ms' => 91861,
                'position' => 50,
                ),
                50 =>
                array (
                'race_result_id' => 643,
                'time_ms' => 94506,
                'position' => 51,
                ),
                )),
                'created_by_user_id' => 4,
                'created_at' => '2025-12-22 00:01:06',
                'updated_at' => '2026-01-01 03:51:44',
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
                'points_system' => json_encode(array (
            1 => 25,
            2 => 20,
            3 => 16,
            4 => 13,
            5 => 11,
            6 => 10,
            7 => 9,
            8 => 8,
            9 => 7,
            10 => 6,
            11 => 5,
            12 => 4,
            13 => 3,
            14 => 2,
            15 => 1,
            16 => 0,
                )),
                'round_points' => true,
                'status' => 'completed',
                'round_results' => json_encode(array (
        'standings' =>
        array (
        0 =>
        array (
        'division_id' => 1,
        'division_name' => 'Division 1',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 25,
          'driver_name' => 'Dstinct_Andrew',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 25,
          'total_points' => 25,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 76,
          'driver_name' => 'warrior2167',
          'race_points' => 0,
          'fastest_lap_points' => 1,
          'pole_position_points' => 1,
          'round_points' => 20,
          'total_points' => 22,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 38,
          'driver_name' => 'JimothyPayload',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 16,
          'total_points' => 16,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 82,
          'driver_name' => 'BlockyRex1',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 13,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
        ),
        4 =>
        array (
          'position' => 5,
          'driver_id' => 75,
          'driver_name' => 'Viperzed',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 11,
          'total_points' => 11,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
        ),
        ),
        ),
        1 =>
        array (
        'division_id' => 3,
        'division_name' => 'Division 3',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 22,
          'driver_name' => 'Donsflyup',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 25,
          'total_points' => 25,
          'total_positions_gained' => 4,
          'has_any_dnf' => false,
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 69,
          'driver_name' => 'T F Eccles',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 20,
          'total_points' => 20,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 51,
          'driver_name' => 'Ozglenn',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 16,
          'total_points' => 16,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 68,
          'driver_name' => 'Sylveon with a gun',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 13,
          'total_positions_gained' => 4,
          'has_any_dnf' => false,
        ),
        4 =>
        array (
          'position' => 5,
          'driver_id' => 70,
          'driver_name' => 'T-GT Racing',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 11,
          'total_points' => 11,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
        ),
        5 =>
        array (
          'position' => 6,
          'driver_id' => 2,
          'driver_name' => 'anders_race',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 10,
          'total_points' => 10,
          'total_positions_gained' => 5,
          'has_any_dnf' => false,
        ),
        6 =>
        array (
          'position' => 7,
          'driver_id' => 20,
          'driver_name' => 'Dash_Vanguard',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 9,
          'total_points' => 9,
          'total_positions_gained' => 3,
          'has_any_dnf' => false,
        ),
        7 =>
        array (
          'position' => 8,
          'driver_id' => 14,
          'driver_name' => 'BritzLightning55',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 8,
          'total_points' => 8,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
        ),
        8 =>
        array (
          'position' => 9,
          'driver_id' => 79,
          'driver_name' => 'X-3vi1 m00n',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 7,
          'total_points' => 7,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
        ),
        9 =>
        array (
          'position' => 10,
          'driver_id' => 59,
          'driver_name' => 'Schumojo 13',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 6,
          'total_points' => 6,
          'total_positions_gained' => -7,
          'has_any_dnf' => false,
        ),
        10 =>
        array (
          'position' => 11,
          'driver_id' => 30,
          'driver_name' => 'Half-Byte',
          'race_points' => 0,
          'fastest_lap_points' => 1,
          'pole_position_points' => 0,
          'round_points' => 5,
          'total_points' => 6,
          'total_positions_gained' => -4,
          'has_any_dnf' => false,
        ),
        11 =>
        array (
          'position' => 12,
          'driver_id' => 72,
          'driver_name' => 'tolley_',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 1,
          'round_points' => 4,
          'total_points' => 5,
          'total_positions_gained' => 0,
          'has_any_dnf' => true,
        ),
        ),
        ),
        2 =>
        array (
        'division_id' => 4,
        'division_name' => 'Division 4',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 31,
          'driver_name' => 'Hatchy3_',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 25,
          'total_points' => 25,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 43,
          'driver_name' => 'Kiwi_kart_racer9',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 1,
          'round_points' => 20,
          'total_points' => 21,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 5,
          'driver_name' => 'AverageDad',
          'race_points' => 0,
          'fastest_lap_points' => 1,
          'pole_position_points' => 0,
          'round_points' => 16,
          'total_points' => 17,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 74,
          'driver_name' => 'Vert Wheeler',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 13,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
        ),
        4 =>
        array (
          'position' => 5,
          'driver_id' => 35,
          'driver_name' => 'J.Nightingale',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 11,
          'total_points' => 11,
          'total_positions_gained' => 6,
          'has_any_dnf' => false,
        ),
        5 =>
        array (
          'position' => 6,
          'driver_id' => 50,
          'driver_name' => 'Natalie WA',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 10,
          'total_points' => 10,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
        ),
        6 =>
        array (
          'position' => 7,
          'driver_id' => 36,
          'driver_name' => 'JC_Blaize',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 9,
          'total_points' => 9,
          'total_positions_gained' => -2,
          'has_any_dnf' => false,
        ),
        7 =>
        array (
          'position' => 8,
          'driver_id' => 34,
          'driver_name' => 'j. Farley',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 8,
          'total_points' => 8,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
        ),
        8 =>
        array (
          'position' => 9,
          'driver_id' => 12,
          'driver_name' => 'Bluntman75',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 7,
          'total_points' => 7,
          'total_positions_gained' => -2,
          'has_any_dnf' => false,
        ),
        9 =>
        array (
          'position' => 10,
          'driver_id' => 49,
          'driver_name' => 'Muzzie_013',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 6,
          'total_points' => 6,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
        ),
        10 =>
        array (
          'position' => 11,
          'driver_id' => 53,
          'driver_name' => 'rae1982',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 5,
          'total_points' => 5,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
        ),
        11 =>
        array (
          'position' => 12,
          'driver_id' => 78,
          'driver_name' => 'Wolfy 1961',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 4,
          'total_points' => 4,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
        ),
        12 =>
        array (
          'position' => 13,
          'driver_id' => 3,
          'driver_name' => 'arnoldwa',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 3,
          'total_points' => 3,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
        ),
        13 =>
        array (
          'position' => 14,
          'driver_id' => 45,
          'driver_name' => 'Luppo',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 2,
          'total_points' => 2,
          'total_positions_gained' => 0,
          'has_any_dnf' => true,
        ),
        ),
        ),
        3 =>
        array (
        'division_id' => 2,
        'division_name' => 'Division 2',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 47,
          'driver_name' => 'Matthyus',
          'race_points' => 0,
          'fastest_lap_points' => 1,
          'pole_position_points' => 1,
          'round_points' => 25,
          'total_points' => 27,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 73,
          'driver_name' => 'UrsineSaturn9',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 20,
          'total_points' => 20,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 1,
          'driver_name' => 'Alexb8891',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 16,
          'total_points' => 16,
          'total_positions_gained' => 3,
          'has_any_dnf' => false,
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 26,
          'driver_name' => 'E. Presley',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 13,
          'total_positions_gained' => -2,
          'has_any_dnf' => false,
        ),
        4 =>
        array (
          'position' => 5,
          'driver_id' => 67,
          'driver_name' => 'Stinky',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 11,
          'total_points' => 11,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
        ),
        5 =>
        array (
          'position' => 6,
          'driver_id' => 60,
          'driver_name' => 'Selduin',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 10,
          'total_points' => 10,
          'total_positions_gained' => -2,
          'has_any_dnf' => false,
        ),
        6 =>
        array (
          'position' => 7,
          'driver_id' => 23,
          'driver_name' => 'Doodah27',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 9,
          'total_points' => 9,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
        ),
        7 =>
        array (
          'position' => 8,
          'driver_id' => 37,
          'driver_name' => 'Jelly Mechanic',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 8,
          'total_points' => 8,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
        ),
        8 =>
        array (
          'position' => 9,
          'driver_id' => 40,
          'driver_name' => 'K. Brown',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 7,
          'total_points' => 7,
          'total_positions_gained' => -4,
          'has_any_dnf' => false,
        ),
        ),
        ),
                ),
                )),
                'qualifying_results' => json_encode(array (
        0 =>
        array (
        'race_result_id' => 672,
        'time_ms' => 78292,
        'position' => 1,
                ),
                1 =>
                array (
                'race_result_id' => 673,
                'time_ms' => 78339,
                'position' => 2,
                ),
                2 =>
                array (
                'race_result_id' => 674,
                'time_ms' => 78415,
                'position' => 3,
                ),
                3 =>
                array (
                'race_result_id' => 677,
                'time_ms' => 78741,
                'position' => 4,
                ),
                4 =>
                array (
                'race_result_id' => 678,
                'time_ms' => 78922,
                'position' => 5,
                ),
                5 =>
                array (
                'race_result_id' => 675,
                'time_ms' => 78952,
                'position' => 6,
                ),
                6 =>
                array (
                'race_result_id' => 679,
                'time_ms' => 79058,
                'position' => 7,
                ),
                7 =>
                array (
                'race_result_id' => 686,
                'time_ms' => 79133,
                'position' => 8,
                ),
                8 =>
                array (
                'race_result_id' => 680,
                'time_ms' => 79149,
                'position' => 9,
                ),
                9 =>
                array (
                'race_result_id' => 681,
                'time_ms' => 79318,
                'position' => 10,
                ),
                10 =>
                array (
                'race_result_id' => 676,
                'time_ms' => 79360,
                'position' => 11,
                ),
                11 =>
                array (
                'race_result_id' => 687,
                'time_ms' => 79376,
                'position' => 12,
                ),
                12 =>
                array (
                'race_result_id' => 688,
                'time_ms' => 79387,
                'position' => 13,
                ),
                13 =>
                array (
                'race_result_id' => 689,
                'time_ms' => 79454,
                'position' => 14,
                ),
                14 =>
                array (
                'race_result_id' => 690,
                'time_ms' => 79490,
                'position' => 15,
                ),
                15 =>
                array (
                'race_result_id' => 682,
                'time_ms' => 79492,
                'position' => 16,
                ),
                16 =>
                array (
                'race_result_id' => 691,
                'time_ms' => 79498,
                'position' => 17,
                ),
                17 =>
                array (
                'race_result_id' => 692,
                'time_ms' => 79526,
                'position' => 18,
                ),
                18 =>
                array (
                'race_result_id' => 693,
                'time_ms' => 79548,
                'position' => 19,
                ),
                19 =>
                array (
                'race_result_id' => 697,
                'time_ms' => 79553,
                'position' => 20,
                ),
                20 =>
                array (
                'race_result_id' => 683,
                'time_ms' => 79609,
                'position' => 21,
                ),
                21 =>
                array (
                'race_result_id' => 698,
                'time_ms' => 79693,
                'position' => 22,
                ),
                22 =>
                array (
                'race_result_id' => 694,
                'time_ms' => 79731,
                'position' => 23,
                ),
                23 =>
                array (
                'race_result_id' => 684,
                'time_ms' => 79735,
                'position' => 24,
                ),
                24 =>
                array (
                'race_result_id' => 695,
                'time_ms' => 79747,
                'position' => 25,
                ),
                25 =>
                array (
                'race_result_id' => 696,
                'time_ms' => 79765,
                'position' => 26,
                ),
                26 =>
                array (
                'race_result_id' => 699,
                'time_ms' => 79905,
                'position' => 27,
                ),
                27 =>
                array (
                'race_result_id' => 685,
                'time_ms' => 79960,
                'position' => 28,
                ),
                28 =>
                array (
                'race_result_id' => 700,
                'time_ms' => 80431,
                'position' => 29,
                ),
                29 =>
                array (
                'race_result_id' => 701,
                'time_ms' => 80436,
                'position' => 30,
                ),
                30 =>
                array (
                'race_result_id' => 702,
                'time_ms' => 80855,
                'position' => 31,
                ),
                31 =>
                array (
                'race_result_id' => 703,
                'time_ms' => 80979,
                'position' => 32,
                ),
                32 =>
                array (
                'race_result_id' => 704,
                'time_ms' => 81050,
                'position' => 33,
                ),
                33 =>
                array (
                'race_result_id' => 705,
                'time_ms' => 81226,
                'position' => 34,
                ),
                34 =>
                array (
                'race_result_id' => 706,
                'time_ms' => 81752,
                'position' => 35,
                ),
                35 =>
                array (
                'race_result_id' => 707,
                'time_ms' => 81807,
                'position' => 36,
                ),
                36 =>
                array (
                'race_result_id' => 708,
                'time_ms' => 81867,
                'position' => 37,
                ),
                37 =>
                array (
                'race_result_id' => 709,
                'time_ms' => 81995,
                'position' => 38,
                ),
                38 =>
                array (
                'race_result_id' => 710,
                'time_ms' => 83801,
                'position' => 39,
                ),
                )),
                'race_time_results' => json_encode(array (
        0 =>
        array (
        'race_result_id' => 711,
        'time_ms' => 2622040,
        'position' => 1,
                ),
                1 =>
                array (
                'race_result_id' => 712,
                'time_ms' => 2626814,
                'position' => 2,
                ),
                2 =>
                array (
                'race_result_id' => 713,
                'time_ms' => 2642044,
                'position' => 3,
                ),
                3 =>
                array (
                'race_result_id' => 716,
                'time_ms' => 2661489,
                'position' => 4,
                ),
                4 =>
                array (
                'race_result_id' => 714,
                'time_ms' => 2667774,
                'position' => 5,
                ),
                5 =>
                array (
                'race_result_id' => 715,
                'time_ms' => 2669884,
                'position' => 6,
                ),
                6 =>
                array (
                'race_result_id' => 717,
                'time_ms' => 2673572,
                'position' => 7,
                ),
                7 =>
                array (
                'race_result_id' => 718,
                'time_ms' => 2674628,
                'position' => 8,
                ),
                8 =>
                array (
                'race_result_id' => 719,
                'time_ms' => 2677216,
                'position' => 9,
                ),
                9 =>
                array (
                'race_result_id' => 725,
                'time_ms' => 2682742,
                'position' => 10,
                ),
                10 =>
                array (
                'race_result_id' => 720,
                'time_ms' => 2685147,
                'position' => 11,
                ),
                11 =>
                array (
                'race_result_id' => 726,
                'time_ms' => 2691647,
                'position' => 12,
                ),
                12 =>
                array (
                'race_result_id' => 721,
                'time_ms' => 2692502,
                'position' => 13,
                ),
                13 =>
                array (
                'race_result_id' => 727,
                'time_ms' => 2694716,
                'position' => 14,
                ),
                14 =>
                array (
                'race_result_id' => 737,
                'time_ms' => 2700029,
                'position' => 15,
                ),
                15 =>
                array (
                'race_result_id' => 738,
                'time_ms' => 2700224,
                'position' => 16,
                ),
                16 =>
                array (
                'race_result_id' => 739,
                'time_ms' => 2703052,
                'position' => 17,
                ),
                17 =>
                array (
                'race_result_id' => 722,
                'time_ms' => 2706292,
                'position' => 18,
                ),
                18 =>
                array (
                'race_result_id' => 728,
                'time_ms' => 2706573,
                'position' => 19,
                ),
                19 =>
                array (
                'race_result_id' => 723,
                'time_ms' => 2710074,
                'position' => 20,
                ),
                20 =>
                array (
                'race_result_id' => 729,
                'time_ms' => 2713177,
                'position' => 21,
                ),
                21 =>
                array (
                'race_result_id' => 724,
                'time_ms' => 2720012,
                'position' => 22,
                ),
                22 =>
                array (
                'race_result_id' => 730,
                'time_ms' => 2720401,
                'position' => 23,
                ),
                23 =>
                array (
                'race_result_id' => 740,
                'time_ms' => 2721300,
                'position' => 24,
                ),
                24 =>
                array (
                'race_result_id' => 731,
                'time_ms' => 2722360,
                'position' => 25,
                ),
                25 =>
                array (
                'race_result_id' => 732,
                'time_ms' => 2723156,
                'position' => 26,
                ),
                26 =>
                array (
                'race_result_id' => 733,
                'time_ms' => 2728036,
                'position' => 27,
                ),
                27 =>
                array (
                'race_result_id' => 741,
                'time_ms' => 2734451,
                'position' => 28,
                ),
                28 =>
                array (
                'race_result_id' => 742,
                'time_ms' => 2741734,
                'position' => 29,
                ),
                29 =>
                array (
                'race_result_id' => 734,
                'time_ms' => 2742250,
                'position' => 30,
                ),
                30 =>
                array (
                'race_result_id' => 743,
                'time_ms' => 2760149,
                'position' => 31,
                ),
                31 =>
                array (
                'race_result_id' => 735,
                'time_ms' => 2760831,
                'position' => 32,
                ),
                32 =>
                array (
                'race_result_id' => 744,
                'time_ms' => 2764512,
                'position' => 33,
                ),
                33 =>
                array (
                'race_result_id' => 745,
                'time_ms' => 2767841,
                'position' => 34,
                ),
                34 =>
                array (
                'race_result_id' => 746,
                'time_ms' => 2770841,
                'position' => 35,
                ),
                35 =>
                array (
                'race_result_id' => 747,
                'time_ms' => 2777841,
                'position' => 36,
                ),
                36 =>
                array (
                'race_result_id' => 748,
                'time_ms' => 2864841,
                'position' => 37,
                ),
                37 =>
                array (
                'race_result_id' => 749,
                'time_ms' => 2868841,
                'position' => 38,
                ),
                )),
                'fastest_lap_results' => json_encode(array (
        0 =>
        array (
        'race_result_id' => 712,
        'time_ms' => 77898,
        'position' => 1,
                ),
                1 =>
                array (
                'race_result_id' => 711,
                'time_ms' => 77970,
                'position' => 2,
                ),
                2 =>
                array (
                'race_result_id' => 714,
                'time_ms' => 78446,
                'position' => 3,
                ),
                3 =>
                array (
                'race_result_id' => 715,
                'time_ms' => 78495,
                'position' => 4,
                ),
                4 =>
                array (
                'race_result_id' => 713,
                'time_ms' => 78561,
                'position' => 5,
                ),
                5 =>
                array (
                'race_result_id' => 716,
                'time_ms' => 78698,
                'position' => 6,
                ),
                6 =>
                array (
                'race_result_id' => 735,
                'time_ms' => 78725,
                'position' => 7,
                ),
                7 =>
                array (
                'race_result_id' => 719,
                'time_ms' => 78796,
                'position' => 8,
                ),
                8 =>
                array (
                'race_result_id' => 721,
                'time_ms' => 78810,
                'position' => 9,
                ),
                9 =>
                array (
                'race_result_id' => 728,
                'time_ms' => 78976,
                'position' => 10,
                ),
                10 =>
                array (
                'race_result_id' => 717,
                'time_ms' => 79011,
                'position' => 11,
                ),
                11 =>
                array (
                'race_result_id' => 725,
                'time_ms' => 79027,
                'position' => 12,
                ),
                12 =>
                array (
                'race_result_id' => 727,
                'time_ms' => 79092,
                'position' => 13,
                ),
                13 =>
                array (
                'race_result_id' => 718,
                'time_ms' => 79192,
                'position' => 14,
                ),
                14 =>
                array (
                'race_result_id' => 734,
                'time_ms' => 79283,
                'position' => 15,
                ),
                15 =>
                array (
                'race_result_id' => 724,
                'time_ms' => 79300,
                'position' => 16,
                ),
                16 =>
                array (
                'race_result_id' => 720,
                'time_ms' => 79332,
                'position' => 17,
                ),
                17 =>
                array (
                'race_result_id' => 723,
                'time_ms' => 79389,
                'position' => 18,
                ),
                18 =>
                array (
                'race_result_id' => 722,
                'time_ms' => 79428,
                'position' => 19,
                ),
                19 =>
                array (
                'race_result_id' => 739,
                'time_ms' => 79448,
                'position' => 20,
                ),
                20 =>
                array (
                'race_result_id' => 726,
                'time_ms' => 79570,
                'position' => 21,
                ),
                21 =>
                array (
                'race_result_id' => 738,
                'time_ms' => 79667,
                'position' => 22,
                ),
                22 =>
                array (
                'race_result_id' => 732,
                'time_ms' => 79708,
                'position' => 23,
                ),
                23 =>
                array (
                'race_result_id' => 731,
                'time_ms' => 79768,
                'position' => 24,
                ),
                24 =>
                array (
                'race_result_id' => 733,
                'time_ms' => 79788,
                'position' => 25,
                ),
                25 =>
                array (
                'race_result_id' => 729,
                'time_ms' => 79856,
                'position' => 26,
                ),
                26 =>
                array (
                'race_result_id' => 737,
                'time_ms' => 79860,
                'position' => 27,
                ),
                27 =>
                array (
                'race_result_id' => 730,
                'time_ms' => 79981,
                'position' => 28,
                ),
                28 =>
                array (
                'race_result_id' => 743,
                'time_ms' => 79985,
                'position' => 29,
                ),
                29 =>
                array (
                'race_result_id' => 740,
                'time_ms' => 80198,
                'position' => 30,
                ),
                30 =>
                array (
                'race_result_id' => 742,
                'time_ms' => 80250,
                'position' => 31,
                ),
                31 =>
                array (
                'race_result_id' => 741,
                'time_ms' => 80281,
                'position' => 32,
                ),
                32 =>
                array (
                'race_result_id' => 744,
                'time_ms' => 80390,
                'position' => 33,
                ),
                33 =>
                array (
                'race_result_id' => 750,
                'time_ms' => 80662,
                'position' => 34,
                ),
                34 =>
                array (
                'race_result_id' => 745,
                'time_ms' => 80703,
                'position' => 35,
                ),
                35 =>
                array (
                'race_result_id' => 746,
                'time_ms' => 80974,
                'position' => 36,
                ),
                36 =>
                array (
                'race_result_id' => 747,
                'time_ms' => 81289,
                'position' => 37,
                ),
                37 =>
                array (
                'race_result_id' => 749,
                'time_ms' => 82081,
                'position' => 38,
                ),
                38 =>
                array (
                'race_result_id' => 748,
                'time_ms' => 82673,
                'position' => 39,
                ),
                39 =>
                array (
                'race_result_id' => 736,
                'time_ms' => 83088,
                'position' => 40,
                ),
                )),
                'created_by_user_id' => 4,
                'created_at' => '2025-12-22 00:01:24',
                'updated_at' => '2025-12-23 12:21:45',
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
                'points_system' => json_encode(array (
            1 => 25,
            2 => 20,
            3 => 16,
            4 => 13,
            5 => 11,
            6 => 10,
            7 => 9,
            8 => 8,
            9 => 7,
            10 => 6,
            11 => 5,
            12 => 4,
            13 => 3,
            14 => 2,
            15 => 1,
            16 => 0,
                )),
                'round_points' => true,
                'status' => 'completed',
                'round_results' => json_encode(array (
        'standings' =>
        array (
        0 =>
        array (
        'division_id' => 1,
        'division_name' => 'Division 1',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 54,
          'driver_name' => 'Rangeraus',
          'race_points' => 0,
          'fastest_lap_points' => 1,
          'pole_position_points' => 0,
          'round_points' => 25,
          'total_points' => 26,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 38,
          'driver_name' => 'JimothyPayload',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 20,
          'total_points' => 20,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 76,
          'driver_name' => 'warrior2167',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 1,
          'round_points' => 0,
          'total_points' => 1,
          'total_positions_gained' => 0,
          'has_any_dnf' => true,
          'should_receive_zero_points' => true,
        ),
        ),
        ),
        1 =>
        array (
        'division_id' => 3,
        'division_name' => 'Division 3',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 20,
          'driver_name' => 'Dash_Vanguard',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 25,
          'total_points' => 25,
          'total_positions_gained' => 4,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 64,
          'driver_name' => 'slarty',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 20,
          'total_points' => 20,
          'total_positions_gained' => 4,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 69,
          'driver_name' => 'T F Eccles',
          'race_points' => 0,
          'fastest_lap_points' => 1,
          'pole_position_points' => 0,
          'round_points' => 16,
          'total_points' => 17,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 2,
          'driver_name' => 'anders_race',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 13,
          'total_positions_gained' => 3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        4 =>
        array (
          'position' => 5,
          'driver_id' => 22,
          'driver_name' => 'Donsflyup',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 11,
          'total_points' => 11,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        5 =>
        array (
          'position' => 6,
          'driver_id' => 70,
          'driver_name' => 'T-GT Racing',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 10,
          'total_points' => 10,
          'total_positions_gained' => 3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        6 =>
        array (
          'position' => 7,
          'driver_id' => 79,
          'driver_name' => 'X-3vi1 m00n',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 9,
          'total_points' => 9,
          'total_positions_gained' => -4,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        7 =>
        array (
          'position' => 8,
          'driver_id' => 51,
          'driver_name' => 'Ozglenn',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 8,
          'total_points' => 8,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        8 =>
        array (
          'position' => 9,
          'driver_id' => 28,
          'driver_name' => 'Emmo',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 7,
          'total_points' => 7,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        9 =>
        array (
          'position' => 10,
          'driver_id' => 59,
          'driver_name' => 'Schumojo 13',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 6,
          'total_points' => 6,
          'total_positions_gained' => -2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        10 =>
        array (
          'position' => 11,
          'driver_id' => 66,
          'driver_name' => 'Steve_73_GOOF',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 1,
          'round_points' => 5,
          'total_points' => 6,
          'total_positions_gained' => -10,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        ),
        ),
        2 =>
        array (
        'division_id' => 4,
        'division_name' => 'Division 4',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 31,
          'driver_name' => 'Hatchy3_',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 25,
          'total_points' => 25,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 34,
          'driver_name' => 'j. Farley',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 20,
          'total_points' => 20,
          'total_positions_gained' => 3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 49,
          'driver_name' => 'Muzzie_013',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 1,
          'round_points' => 16,
          'total_points' => 17,
          'total_positions_gained' => -2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 43,
          'driver_name' => 'Kiwi_kart_racer9',
          'race_points' => 0,
          'fastest_lap_points' => 1,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 14,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        4 =>
        array (
          'position' => 5,
          'driver_id' => 74,
          'driver_name' => 'Vert Wheeler',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 11,
          'total_points' => 11,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        5 =>
        array (
          'position' => 6,
          'driver_id' => 27,
          'driver_name' => 'Easyprey007',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 10,
          'total_points' => 10,
          'total_positions_gained' => -3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        6 =>
        array (
          'position' => 7,
          'driver_id' => 36,
          'driver_name' => 'JC_Blaize',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 9,
          'total_points' => 9,
          'total_positions_gained' => 5,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        7 =>
        array (
          'position' => 8,
          'driver_id' => 35,
          'driver_name' => 'J.Nightingale',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 8,
          'total_points' => 8,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        8 =>
        array (
          'position' => 9,
          'driver_id' => 53,
          'driver_name' => 'rae1982',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 7,
          'total_points' => 7,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        9 =>
        array (
          'position' => 10,
          'driver_id' => 50,
          'driver_name' => 'Natalie WA',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 6,
          'total_points' => 6,
          'total_positions_gained' => -3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        10 =>
        array (
          'position' => 11,
          'driver_id' => 3,
          'driver_name' => 'arnoldwa',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 5,
          'total_points' => 5,
          'total_positions_gained' => -2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        11 =>
        array (
          'position' => 12,
          'driver_id' => 45,
          'driver_name' => 'Luppo',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 0,
          'total_points' => 0,
          'total_positions_gained' => 0,
          'has_any_dnf' => true,
          'should_receive_zero_points' => true,
        ),
        12 =>
        array (
          'position' => 13,
          'driver_id' => 33,
          'driver_name' => 'ITZ_JZH17',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 0,
          'total_points' => 0,
          'total_positions_gained' => 0,
          'has_any_dnf' => true,
          'should_receive_zero_points' => true,
        ),
        ),
        ),
        3 =>
        array (
        'division_id' => 2,
        'division_name' => 'Division 2',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 65,
          'driver_name' => 'Snorxal',
          'race_points' => 0,
          'fastest_lap_points' => 1,
          'pole_position_points' => 0,
          'round_points' => 25,
          'total_points' => 26,
          'total_positions_gained' => 3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 73,
          'driver_name' => 'UrsineSaturn9',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 20,
          'total_points' => 20,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 47,
          'driver_name' => 'Matthyus',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 16,
          'total_points' => 16,
          'total_positions_gained' => 5,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 26,
          'driver_name' => 'E. Presley',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 13,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        4 =>
        array (
          'position' => 5,
          'driver_id' => 1,
          'driver_name' => 'Alexb8891',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 11,
          'total_points' => 11,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        5 =>
        array (
          'position' => 6,
          'driver_id' => 60,
          'driver_name' => 'Selduin',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 1,
          'round_points' => 10,
          'total_points' => 11,
          'total_positions_gained' => -5,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        6 =>
        array (
          'position' => 7,
          'driver_id' => 23,
          'driver_name' => 'Doodah27',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 9,
          'total_points' => 9,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        7 =>
        array (
          'position' => 8,
          'driver_id' => 40,
          'driver_name' => 'K. Brown',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 8,
          'total_points' => 8,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        8 =>
        array (
          'position' => 9,
          'driver_id' => 6,
          'driver_name' => 'B. CakePie',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 7,
          'total_points' => 7,
          'total_positions_gained' => 3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        9 =>
        array (
          'position' => 10,
          'driver_id' => 67,
          'driver_name' => 'Stinky',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 6,
          'total_points' => 6,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        10 =>
        array (
          'position' => 11,
          'driver_id' => 13,
          'driver_name' => 'Bob Massie',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 5,
          'total_points' => 5,
          'total_positions_gained' => -6,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        11 =>
        array (
          'position' => 12,
          'driver_id' => 37,
          'driver_name' => 'Jelly Mechanic',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 4,
          'total_points' => 4,
          'total_positions_gained' => -5,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
        ),
        ),
        ),
                ),
                )),
                'qualifying_results' => json_encode(array (
        0 =>
        array (
        'race_result_id' => 751,
        'time_ms' => 49307,
        'position' => 1,
                ),
                1 =>
                array (
                'race_result_id' => 752,
                'time_ms' => 49394,
                'position' => 2,
                ),
                2 =>
                array (
                'race_result_id' => 753,
                'time_ms' => 49615,
                'position' => 3,
                ),
                3 =>
                array (
                'race_result_id' => 754,
                'time_ms' => 49831,
                'position' => 4,
                ),
                4 =>
                array (
                'race_result_id' => 755,
                'time_ms' => 49880,
                'position' => 5,
                ),
                5 =>
                array (
                'race_result_id' => 756,
                'time_ms' => 49931,
                'position' => 6,
                ),
                6 =>
                array (
                'race_result_id' => 757,
                'time_ms' => 50009,
                'position' => 7,
                ),
                7 =>
                array (
                'race_result_id' => 758,
                'time_ms' => 50128,
                'position' => 8,
                ),
                8 =>
                array (
                'race_result_id' => 766,
                'time_ms' => 50163,
                'position' => 9,
                ),
                9 =>
                array (
                'race_result_id' => 759,
                'time_ms' => 50190,
                'position' => 10,
                ),
                10 =>
                array (
                'race_result_id' => 760,
                'time_ms' => 50222,
                'position' => 11,
                ),
                11 =>
                array (
                'race_result_id' => 761,
                'time_ms' => 50263,
                'position' => 12,
                ),
                12 =>
                array (
                'race_result_id' => 767,
                'time_ms' => 50274,
                'position' => 13,
                ),
                13 =>
                array (
                'race_result_id' => 768,
                'time_ms' => 50368,
                'position' => 14,
                ),
                14 =>
                array (
                'race_result_id' => 762,
                'time_ms' => 50392,
                'position' => 15,
                ),
                15 =>
                array (
                'race_result_id' => 763,
                'time_ms' => 50413,
                'position' => 16,
                ),
                16 =>
                array (
                'race_result_id' => 769,
                'time_ms' => 50437,
                'position' => 17,
                ),
                17 =>
                array (
                'race_result_id' => 770,
                'time_ms' => 50472,
                'position' => 18,
                ),
                18 =>
                array (
                'race_result_id' => 771,
                'time_ms' => 50514,
                'position' => 19,
                ),
                19 =>
                array (
                'race_result_id' => 764,
                'time_ms' => 50541,
                'position' => 20,
                ),
                20 =>
                array (
                'race_result_id' => 772,
                'time_ms' => 50586,
                'position' => 21,
                ),
                21 =>
                array (
                'race_result_id' => 773,
                'time_ms' => 50615,
                'position' => 22,
                ),
                22 =>
                array (
                'race_result_id' => 777,
                'time_ms' => 50660,
                'position' => 23,
                ),
                23 =>
                array (
                'race_result_id' => 778,
                'time_ms' => 50716,
                'position' => 24,
                ),
                24 =>
                array (
                'race_result_id' => 774,
                'time_ms' => 50751,
                'position' => 25,
                ),
                25 =>
                array (
                'race_result_id' => 779,
                'time_ms' => 50760,
                'position' => 26,
                ),
                26 =>
                array (
                'race_result_id' => 780,
                'time_ms' => 50774,
                'position' => 27,
                ),
                27 =>
                array (
                'race_result_id' => 781,
                'time_ms' => 50832,
                'position' => 28,
                ),
                28 =>
                array (
                'race_result_id' => 782,
                'time_ms' => 50833,
                'position' => 29,
                ),
                29 =>
                array (
                'race_result_id' => 775,
                'time_ms' => 50853,
                'position' => 30,
                ),
                30 =>
                array (
                'race_result_id' => 783,
                'time_ms' => 50854,
                'position' => 31,
                ),
                31 =>
                array (
                'race_result_id' => 765,
                'time_ms' => 50870,
                'position' => 32,
                ),
                32 =>
                array (
                'race_result_id' => 776,
                'time_ms' => 50892,
                'position' => 33,
                ),
                33 =>
                array (
                'race_result_id' => 784,
                'time_ms' => 51108,
                'position' => 34,
                ),
                34 =>
                array (
                'race_result_id' => 785,
                'time_ms' => 51271,
                'position' => 35,
                ),
                35 =>
                array (
                'race_result_id' => 786,
                'time_ms' => 51349,
                'position' => 36,
                ),
                36 =>
                array (
                'race_result_id' => 787,
                'time_ms' => 51622,
                'position' => 37,
                ),
                37 =>
                array (
                'race_result_id' => 788,
                'time_ms' => 51635,
                'position' => 38,
                ),
                38 =>
                array (
                'race_result_id' => 789,
                'time_ms' => 54180,
                'position' => 39,
                ),
                )),
                'race_time_results' => json_encode(array (
        0 =>
        array (
        'race_result_id' => 868,
        'time_ms' => 3458826,
        'position' => 1,
                ),
                1 =>
                array (
                'race_result_id' => 869,
                'time_ms' => 3482160,
                'position' => 2,
                ),
                2 =>
                array (
                'race_result_id' => 871,
                'time_ms' => 3502693,
                'position' => 3,
                ),
                3 =>
                array (
                'race_result_id' => 872,
                'time_ms' => 3525793,
                'position' => 4,
                ),
                4 =>
                array (
                'race_result_id' => 873,
                'time_ms' => 3527293,
                'position' => 5,
                ),
                5 =>
                array (
                'race_result_id' => 874,
                'time_ms' => 3527993,
                'position' => 6,
                ),
                6 =>
                array (
                'race_result_id' => 896,
                'time_ms' => 3536563,
                'position' => 7,
                ),
                7 =>
                array (
                'race_result_id' => 875,
                'time_ms' => 3538593,
                'position' => 8,
                ),
                8 =>
                array (
                'race_result_id' => 876,
                'time_ms' => 3539193,
                'position' => 9,
                ),
                9 =>
                array (
                'race_result_id' => 877,
                'time_ms' => 3540293,
                'position' => 10,
                ),
                10 =>
                array (
                'race_result_id' => 897,
                'time_ms' => 3540718,
                'position' => 11,
                ),
                11 =>
                array (
                'race_result_id' => 878,
                'time_ms' => 3541093,
                'position' => 12,
                ),
                12 =>
                array (
                'race_result_id' => 898,
                'time_ms' => 3542966,
                'position' => 13,
                ),
                13 =>
                array (
                'race_result_id' => 899,
                'time_ms' => 3543717,
                'position' => 14,
                ),
                14 =>
                array (
                'race_result_id' => 879,
                'time_ms' => 3544293,
                'position' => 15,
                ),
                15 =>
                array (
                'race_result_id' => 880,
                'time_ms' => 3546493,
                'position' => 16,
                ),
                16 =>
                array (
                'race_result_id' => 883,
                'time_ms' => 3549527,
                'position' => 17,
                ),
                17 =>
                array (
                'race_result_id' => 900,
                'time_ms' => 3551867,
                'position' => 18,
                ),
                18 =>
                array (
                'race_result_id' => 881,
                'time_ms' => 3559093,
                'position' => 19,
                ),
                19 =>
                array (
                'race_result_id' => 901,
                'time_ms' => 3560524,
                'position' => 20,
                ),
                20 =>
                array (
                'race_result_id' => 902,
                'time_ms' => 3561695,
                'position' => 21,
                ),
                21 =>
                array (
                'race_result_id' => 903,
                'time_ms' => 3563874,
                'position' => 22,
                ),
                22 =>
                array (
                'race_result_id' => 884,
                'time_ms' => 3570983,
                'position' => 23,
                ),
                23 =>
                array (
                'race_result_id' => 885,
                'time_ms' => 3571117,
                'position' => 24,
                ),
                24 =>
                array (
                'race_result_id' => 904,
                'time_ms' => 3576156,
                'position' => 25,
                ),
                25 =>
                array (
                'race_result_id' => 886,
                'time_ms' => 3584917,
                'position' => 26,
                ),
                26 =>
                array (
                'race_result_id' => 905,
                'time_ms' => 3596156,
                'position' => 27,
                ),
                27 =>
                array (
                'race_result_id' => 887,
                'time_ms' => 3599771,
                'position' => 28,
                ),
                28 =>
                array (
                'race_result_id' => 888,
                'time_ms' => 3600771,
                'position' => 29,
                ),
                29 =>
                array (
                'race_result_id' => 889,
                'time_ms' => 3602771,
                'position' => 30,
                ),
                30 =>
                array (
                'race_result_id' => 882,
                'time_ms' => 3603593,
                'position' => 31,
                ),
                31 =>
                array (
                'race_result_id' => 890,
                'time_ms' => 3604771,
                'position' => 32,
                ),
                32 =>
                array (
                'race_result_id' => 891,
                'time_ms' => 3606771,
                'position' => 33,
                ),
                33 =>
                array (
                'race_result_id' => 892,
                'time_ms' => 3608771,
                'position' => 34,
                ),
                34 =>
                array (
                'race_result_id' => 906,
                'time_ms' => 3637156,
                'position' => 35,
                ),
                35 =>
                array (
                'race_result_id' => 893,
                'time_ms' => 3649771,
                'position' => 36,
                ),
                )),
                'fastest_lap_results' => json_encode(array (
        0 =>
        array (
        'race_result_id' => 868,
        'time_ms' => 49239,
        'position' => 1,
                ),
                1 =>
                array (
                'race_result_id' => 870,
                'time_ms' => 49261,
                'position' => 2,
                ),
                2 =>
                array (
                'race_result_id' => 869,
                'time_ms' => 49564,
                'position' => 3,
                ),
                3 =>
                array (
                'race_result_id' => 871,
                'time_ms' => 49617,
                'position' => 4,
                ),
                4 =>
                array (
                'race_result_id' => 874,
                'time_ms' => 49743,
                'position' => 5,
                ),
                5 =>
                array (
                'race_result_id' => 878,
                'time_ms' => 49884,
                'position' => 6,
                ),
                6 =>
                array (
                'race_result_id' => 876,
                'time_ms' => 49903,
                'position' => 7,
                ),
                7 =>
                array (
                'race_result_id' => 877,
                'time_ms' => 50005,
                'position' => 8,
                ),
                8 =>
                array (
                'race_result_id' => 873,
                'time_ms' => 50028,
                'position' => 9,
                ),
                9 =>
                array (
                'race_result_id' => 898,
                'time_ms' => 50034,
                'position' => 10,
                ),
                10 =>
                array (
                'race_result_id' => 896,
                'time_ms' => 50061,
                'position' => 11,
                ),
                11 =>
                array (
                'race_result_id' => 899,
                'time_ms' => 50107,
                'position' => 12,
                ),
                12 =>
                array (
                'race_result_id' => 902,
                'time_ms' => 50111,
                'position' => 13,
                ),
                13 =>
                array (
                'race_result_id' => 875,
                'time_ms' => 50115,
                'position' => 14,
                ),
                14 =>
                array (
                'race_result_id' => 897,
                'time_ms' => 50118,
                'position' => 15,
                ),
                15 =>
                array (
                'race_result_id' => 900,
                'time_ms' => 50154,
                'position' => 16,
                ),
                16 =>
                array (
                'race_result_id' => 879,
                'time_ms' => 50167,
                'position' => 17,
                ),
                17 =>
                array (
                'race_result_id' => 880,
                'time_ms' => 50184,
                'position' => 18,
                ),
                18 =>
                array (
                'race_result_id' => 882,
                'time_ms' => 50189,
                'position' => 19,
                ),
                19 =>
                array (
                'race_result_id' => 881,
                'time_ms' => 50242,
                'position' => 20,
                ),
                20 =>
                array (
                'race_result_id' => 906,
                'time_ms' => 50262,
                'position' => 21,
                ),
                21 =>
                array (
                'race_result_id' => 901,
                'time_ms' => 50297,
                'position' => 22,
                ),
                22 =>
                array (
                'race_result_id' => 872,
                'time_ms' => 50299,
                'position' => 23,
                ),
                23 =>
                array (
                'race_result_id' => 903,
                'time_ms' => 50324,
                'position' => 24,
                ),
                24 =>
                array (
                'race_result_id' => 886,
                'time_ms' => 50328,
                'position' => 25,
                ),
                25 =>
                array (
                'race_result_id' => 883,
                'time_ms' => 50389,
                'position' => 26,
                ),
                26 =>
                array (
                'race_result_id' => 885,
                'time_ms' => 50451,
                'position' => 27,
                ),
                27 =>
                array (
                'race_result_id' => 904,
                'time_ms' => 50467,
                'position' => 28,
                ),
                28 =>
                array (
                'race_result_id' => 905,
                'time_ms' => 50479,
                'position' => 29,
                ),
                29 =>
                array (
                'race_result_id' => 884,
                'time_ms' => 50553,
                'position' => 30,
                ),
                30 =>
                array (
                'race_result_id' => 892,
                'time_ms' => 50580,
                'position' => 31,
                ),
                31 =>
                array (
                'race_result_id' => 887,
                'time_ms' => 50724,
                'position' => 32,
                ),
                32 =>
                array (
                'race_result_id' => 888,
                'time_ms' => 50809,
                'position' => 33,
                ),
                33 =>
                array (
                'race_result_id' => 889,
                'time_ms' => 50815,
                'position' => 34,
                ),
                34 =>
                array (
                'race_result_id' => 895,
                'time_ms' => 50868,
                'position' => 35,
                ),
                35 =>
                array (
                'race_result_id' => 891,
                'time_ms' => 50931,
                'position' => 36,
                ),
                36 =>
                array (
                'race_result_id' => 890,
                'time_ms' => 50958,
                'position' => 37,
                ),
                37 =>
                array (
                'race_result_id' => 893,
                'time_ms' => 51153,
                'position' => 38,
                ),
                38 =>
                array (
                'race_result_id' => 894,
                'time_ms' => 51275,
                'position' => 39,
                ),
                )),
                'created_by_user_id' => 4,
                'created_at' => '2025-12-22 00:01:41',
                'updated_at' => '2025-12-24 13:04:12',
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
                'points_system' => json_encode(array (
            1 => 25,
            2 => 20,
            3 => 16,
            4 => 13,
            5 => 11,
            6 => 10,
            7 => 9,
            8 => 8,
            9 => 7,
            10 => 6,
            11 => 5,
            12 => 4,
            13 => 3,
            14 => 2,
            15 => 1,
            16 => 0,
                )),
                'round_points' => true,
                'status' => 'completed',
                'round_results' => json_encode(array (
        'standings' =>
        array (
        0 =>
        array (
        'division_id' => 1,
        'division_name' => 'Division 1',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 54,
          'driver_name' => 'Rangeraus',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 1,
          'round_points' => 25,
          'total_points' => 26,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 76,
          'driver_name' => 'warrior2167',
          'race_points' => 0,
          'fastest_lap_points' => 1,
          'pole_position_points' => 0,
          'round_points' => 20,
          'total_points' => 21,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 38,
          'driver_name' => 'JimothyPayload',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 16,
          'total_points' => 16,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 75,
          'driver_name' => 'Viperzed',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 0,
          'total_points' => 0,
          'total_positions_gained' => 0,
          'has_any_dnf' => true,
          'should_receive_zero_points' => true,
          'total_penalties' => '0.000',
        ),
        ),
        ),
        1 =>
        array (
        'division_id' => 4,
        'division_name' => 'Division 4',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 31,
          'driver_name' => 'Hatchy3_',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 25,
          'total_points' => 25,
          'total_positions_gained' => 4,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 43,
          'driver_name' => 'Kiwi_kart_racer9',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 1,
          'round_points' => 20,
          'total_points' => 21,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 5,
          'driver_name' => 'AverageDad',
          'race_points' => 0,
          'fastest_lap_points' => 1,
          'pole_position_points' => 0,
          'round_points' => 16,
          'total_points' => 17,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 34,
          'driver_name' => 'j. Farley',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 13,
          'total_positions_gained' => 3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        4 =>
        array (
          'position' => 5,
          'driver_id' => 45,
          'driver_name' => 'Luppo',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 11,
          'total_points' => 11,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        5 =>
        array (
          'position' => 6,
          'driver_id' => 3,
          'driver_name' => 'arnoldwa',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 10,
          'total_points' => 10,
          'total_positions_gained' => -3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        6 =>
        array (
          'position' => 7,
          'driver_id' => 36,
          'driver_name' => 'JC_Blaize',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 9,
          'total_points' => 9,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        7 =>
        array (
          'position' => 8,
          'driver_id' => 49,
          'driver_name' => 'Muzzie_013',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 8,
          'total_points' => 8,
          'total_positions_gained' => -2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        8 =>
        array (
          'position' => 9,
          'driver_id' => 35,
          'driver_name' => 'J.Nightingale',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 7,
          'total_points' => 7,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        9 =>
        array (
          'position' => 10,
          'driver_id' => 74,
          'driver_name' => 'Vert Wheeler',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 6,
          'total_points' => 6,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        10 =>
        array (
          'position' => 11,
          'driver_id' => 50,
          'driver_name' => 'Natalie WA',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 0,
          'total_points' => 0,
          'total_positions_gained' => 0,
          'has_any_dnf' => true,
          'should_receive_zero_points' => true,
          'total_penalties' => '0.000',
        ),
        ),
        ),
        2 =>
        array (
        'division_id' => 3,
        'division_name' => 'Division 3',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 66,
          'driver_name' => 'Steve_73_GOOF',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 1,
          'round_points' => 25,
          'total_points' => 26,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 28,
          'driver_name' => 'Emmo',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 20,
          'total_points' => 20,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 51,
          'driver_name' => 'Ozglenn',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 16,
          'total_points' => 16,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 68,
          'driver_name' => 'Sylveon with a gun',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 13,
          'total_positions_gained' => 3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        4 =>
        array (
          'position' => 5,
          'driver_id' => 64,
          'driver_name' => 'slarty',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 11,
          'total_points' => 11,
          'total_positions_gained' => -3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        5 =>
        array (
          'position' => 6,
          'driver_id' => 22,
          'driver_name' => 'Donsflyup',
          'race_points' => 0,
          'fastest_lap_points' => 1,
          'pole_position_points' => 0,
          'round_points' => 10,
          'total_points' => 11,
          'total_positions_gained' => -3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        6 =>
        array (
          'position' => 7,
          'driver_id' => 14,
          'driver_name' => 'BritzLightning55',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 9,
          'total_points' => 9,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        7 =>
        array (
          'position' => 8,
          'driver_id' => 70,
          'driver_name' => 'T-GT Racing',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 8,
          'total_points' => 8,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        8 =>
        array (
          'position' => 9,
          'driver_id' => 2,
          'driver_name' => 'anders_race',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 7,
          'total_points' => 7,
          'total_positions_gained' => -3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        ),
        ),
        3 =>
        array (
        'division_id' => 2,
        'division_name' => 'Division 2',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 65,
          'driver_name' => 'Snorxal',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 1,
          'round_points' => 25,
          'total_points' => 26,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 47,
          'driver_name' => 'Matthyus',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 20,
          'total_points' => 20,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 73,
          'driver_name' => 'UrsineSaturn9',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 16,
          'total_points' => 16,
          'total_positions_gained' => 3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 26,
          'driver_name' => 'E. Presley',
          'race_points' => 0,
          'fastest_lap_points' => 1,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 14,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        4 =>
        array (
          'position' => 5,
          'driver_id' => 60,
          'driver_name' => 'Selduin',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 11,
          'total_points' => 11,
          'total_positions_gained' => -3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        5 =>
        array (
          'position' => 6,
          'driver_id' => 13,
          'driver_name' => 'Bob Massie',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 10,
          'total_points' => 10,
          'total_positions_gained' => -3,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        6 =>
        array (
          'position' => 7,
          'driver_id' => 37,
          'driver_name' => 'Jelly Mechanic',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 9,
          'total_points' => 9,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        7 =>
        array (
          'position' => 8,
          'driver_id' => 23,
          'driver_name' => 'Doodah27',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 8,
          'total_points' => 8,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        8 =>
        array (
          'position' => 9,
          'driver_id' => 67,
          'driver_name' => 'Stinky',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 7,
          'total_points' => 7,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'should_receive_zero_points' => false,
          'total_penalties' => '0.000',
        ),
        9 =>
        array (
          'position' => 10,
          'driver_id' => 77,
          'driver_name' => 'Whizz94',
          'race_points' => 0,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 0,
          'total_points' => 0,
          'total_positions_gained' => 0,
          'has_any_dnf' => true,
          'should_receive_zero_points' => true,
          'total_penalties' => '0.000',
        ),
        ),
        ),
                ),
                )),
                'qualifying_results' => json_encode(array (
        0 =>
        array (
        'race_result_id' => 907,
        'time_ms' => 80528,
        'position' => 1,
                ),
                1 =>
                array (
                'race_result_id' => 908,
                'time_ms' => 80528,
                'position' => 2,
                ),
                2 =>
                array (
                'race_result_id' => 909,
                'time_ms' => 80857,
                'position' => 3,
                ),
                3 =>
                array (
                'race_result_id' => 910,
                'time_ms' => 80909,
                'position' => 4,
                ),
                4 =>
                array (
                'race_result_id' => 911,
                'time_ms' => 81139,
                'position' => 5,
                ),
                5 =>
                array (
                'race_result_id' => 912,
                'time_ms' => 81261,
                'position' => 6,
                ),
                6 =>
                array (
                'race_result_id' => 913,
                'time_ms' => 81405,
                'position' => 7,
                ),
                7 =>
                array (
                'race_result_id' => 914,
                'time_ms' => 81416,
                'position' => 8,
                ),
                8 =>
                array (
                'race_result_id' => 915,
                'time_ms' => 81434,
                'position' => 9,
                ),
                9 =>
                array (
                'race_result_id' => 916,
                'time_ms' => 81614,
                'position' => 10,
                ),
                10 =>
                array (
                'race_result_id' => 917,
                'time_ms' => 81789,
                'position' => 11,
                ),
                11 =>
                array (
                'race_result_id' => 918,
                'time_ms' => 81819,
                'position' => 12,
                ),
                12 =>
                array (
                'race_result_id' => 921,
                'time_ms' => 81872,
                'position' => 13,
                ),
                13 =>
                array (
                'race_result_id' => 922,
                'time_ms' => 81953,
                'position' => 14,
                ),
                14 =>
                array (
                'race_result_id' => 923,
                'time_ms' => 81971,
                'position' => 15,
                ),
                15 =>
                array (
                'race_result_id' => 924,
                'time_ms' => 82087,
                'position' => 16,
                ),
                16 =>
                array (
                'race_result_id' => 925,
                'time_ms' => 82196,
                'position' => 17,
                ),
                17 =>
                array (
                'race_result_id' => 919,
                'time_ms' => 82214,
                'position' => 18,
                ),
                18 =>
                array (
                'race_result_id' => 920,
                'time_ms' => 82247,
                'position' => 19,
                ),
                19 =>
                array (
                'race_result_id' => 926,
                'time_ms' => 82431,
                'position' => 20,
                ),
                20 =>
                array (
                'race_result_id' => 930,
                'time_ms' => 82457,
                'position' => 21,
                ),
                21 =>
                array (
                'race_result_id' => 931,
                'time_ms' => 82482,
                'position' => 22,
                ),
                22 =>
                array (
                'race_result_id' => 927,
                'time_ms' => 82568,
                'position' => 23,
                ),
                23 =>
                array (
                'race_result_id' => 932,
                'time_ms' => 82682,
                'position' => 24,
                ),
                24 =>
                array (
                'race_result_id' => 928,
                'time_ms' => 82702,
                'position' => 25,
                ),
                25 =>
                array (
                'race_result_id' => 933,
                'time_ms' => 82924,
                'position' => 26,
                ),
                26 =>
                array (
                'race_result_id' => 934,
                'time_ms' => 83033,
                'position' => 27,
                ),
                27 =>
                array (
                'race_result_id' => 935,
                'time_ms' => 83343,
                'position' => 28,
                ),
                28 =>
                array (
                'race_result_id' => 936,
                'time_ms' => 83375,
                'position' => 29,
                ),
                29 =>
                array (
                'race_result_id' => 929,
                'time_ms' => 83629,
                'position' => 30,
                ),
                30 =>
                array (
                'race_result_id' => 937,
                'time_ms' => 83735,
                'position' => 31,
                ),
                31 =>
                array (
                'race_result_id' => 938,
                'time_ms' => 83962,
                'position' => 32,
                ),
                32 =>
                array (
                'race_result_id' => 939,
                'time_ms' => 84190,
                'position' => 33,
                ),
                33 =>
                array (
                'race_result_id' => 940,
                'time_ms' => 85659,
                'position' => 34,
                ),
                )),
                'race_time_results' => json_encode(array (
        0 =>
        array (
        'race_result_id' => 941,
        'time_ms' => 2615668,
        'position' => 1,
                ),
                1 =>
                array (
                'race_result_id' => 942,
                'time_ms' => 2616016,
                'position' => 2,
                ),
                2 =>
                array (
                'race_result_id' => 943,
                'time_ms' => 2630798,
                'position' => 3,
                ),
                3 =>
                array (
                'race_result_id' => 945,
                'time_ms' => 2644697,
                'position' => 4,
                ),
                4 =>
                array (
                'race_result_id' => 946,
                'time_ms' => 2656779,
                'position' => 5,
                ),
                5 =>
                array (
                'race_result_id' => 947,
                'time_ms' => 2658335,
                'position' => 6,
                ),
                6 =>
                array (
                'race_result_id' => 948,
                'time_ms' => 2663492,
                'position' => 7,
                ),
                7 =>
                array (
                'race_result_id' => 949,
                'time_ms' => 2667117,
                'position' => 8,
                ),
                8 =>
                array (
                'race_result_id' => 950,
                'time_ms' => 2675041,
                'position' => 9,
                ),
                9 =>
                array (
                'race_result_id' => 955,
                'time_ms' => 2675051,
                'position' => 10,
                ),
                10 =>
                array (
                'race_result_id' => 956,
                'time_ms' => 2677236,
                'position' => 11,
                ),
                11 =>
                array (
                'race_result_id' => 957,
                'time_ms' => 2677663,
                'position' => 12,
                ),
                12 =>
                array (
                'race_result_id' => 958,
                'time_ms' => 2677871,
                'position' => 13,
                ),
                13 =>
                array (
                'race_result_id' => 951,
                'time_ms' => 2678613,
                'position' => 14,
                ),
                14 =>
                array (
                'race_result_id' => 964,
                'time_ms' => 2679343,
                'position' => 15,
                ),
                15 =>
                array (
                'race_result_id' => 965,
                'time_ms' => 2680572,
                'position' => 16,
                ),
                16 =>
                array (
                'race_result_id' => 952,
                'time_ms' => 2685497,
                'position' => 17,
                ),
                17 =>
                array (
                'race_result_id' => 959,
                'time_ms' => 2692332,
                'position' => 18,
                ),
                18 =>
                array (
                'race_result_id' => 966,
                'time_ms' => 2694597,
                'position' => 19,
                ),
                19 =>
                array (
                'race_result_id' => 953,
                'time_ms' => 2694697,
                'position' => 20,
                ),
                20 =>
                array (
                'race_result_id' => 960,
                'time_ms' => 2701423,
                'position' => 21,
                ),
                21 =>
                array (
                'race_result_id' => 961,
                'time_ms' => 2701878,
                'position' => 22,
                ),
                22 =>
                array (
                'race_result_id' => 962,
                'time_ms' => 2705656,
                'position' => 23,
                ),
                23 =>
                array (
                'race_result_id' => 967,
                'time_ms' => 2712084,
                'position' => 24,
                ),
                24 =>
                array (
                'race_result_id' => 968,
                'time_ms' => 2716662,
                'position' => 25,
                ),
                25 =>
                array (
                'race_result_id' => 969,
                'time_ms' => 2717228,
                'position' => 26,
                ),
                26 =>
                array (
                'race_result_id' => 963,
                'time_ms' => 2729471,
                'position' => 27,
                ),
                27 =>
                array (
                'race_result_id' => 970,
                'time_ms' => 2743813,
                'position' => 28,
                ),
                28 =>
                array (
                'race_result_id' => 971,
                'time_ms' => 2744416,
                'position' => 29,
                ),
                29 =>
                array (
                'race_result_id' => 972,
                'time_ms' => 2761445,
                'position' => 30,
                ),
                30 =>
                array (
                'race_result_id' => 973,
                'time_ms' => 2764134,
                'position' => 31,
                ),
                )),
                'fastest_lap_results' => json_encode(array (
        0 =>
        array (
        'race_result_id' => 942,
        'time_ms' => 80385,
        'position' => 1,
                ),
                1 =>
                array (
                'race_result_id' => 941,
                'time_ms' => 80588,
                'position' => 2,
                ),
                2 =>
                array (
                'race_result_id' => 943,
                'time_ms' => 80753,
                'position' => 3,
                ),
                3 =>
                array (
                'race_result_id' => 944,
                'time_ms' => 80983,
                'position' => 4,
                ),
                4 =>
                array (
                'race_result_id' => 948,
                'time_ms' => 81064,
                'position' => 5,
                ),
                5 =>
                array (
                'race_result_id' => 945,
                'time_ms' => 81097,
                'position' => 6,
                ),
                6 =>
                array (
                'race_result_id' => 950,
                'time_ms' => 81214,
                'position' => 7,
                ),
                7 =>
                array (
                'race_result_id' => 947,
                'time_ms' => 81359,
                'position' => 8,
                ),
                8 =>
                array (
                'race_result_id' => 946,
                'time_ms' => 81397,
                'position' => 9,
                ),
                9 =>
                array (
                'race_result_id' => 949,
                'time_ms' => 81474,
                'position' => 10,
                ),
                10 =>
                array (
                'race_result_id' => 951,
                'time_ms' => 81475,
                'position' => 11,
                ),
                11 =>
                array (
                'race_result_id' => 966,
                'time_ms' => 81510,
                'position' => 12,
                ),
                12 =>
                array (
                'race_result_id' => 952,
                'time_ms' => 81527,
                'position' => 13,
                ),
                13 =>
                array (
                'race_result_id' => 960,
                'time_ms' => 81691,
                'position' => 14,
                ),
                14 =>
                array (
                'race_result_id' => 955,
                'time_ms' => 81720,
                'position' => 15,
                ),
                15 =>
                array (
                'race_result_id' => 959,
                'time_ms' => 81787,
                'position' => 16,
                ),
                16 =>
                array (
                'race_result_id' => 954,
                'time_ms' => 81854,
                'position' => 17,
                ),
                17 =>
                array (
                'race_result_id' => 957,
                'time_ms' => 81905,
                'position' => 18,
                ),
                18 =>
                array (
                'race_result_id' => 958,
                'time_ms' => 81956,
                'position' => 19,
                ),
                19 =>
                array (
                'race_result_id' => 964,
                'time_ms' => 82018,
                'position' => 20,
                ),
                20 =>
                array (
                'race_result_id' => 963,
                'time_ms' => 82036,
                'position' => 21,
                ),
                21 =>
                array (
                'race_result_id' => 965,
                'time_ms' => 82093,
                'position' => 22,
                ),
                22 =>
                array (
                'race_result_id' => 956,
                'time_ms' => 82137,
                'position' => 23,
                ),
                23 =>
                array (
                'race_result_id' => 961,
                'time_ms' => 82203,
                'position' => 24,
                ),
                24 =>
                array (
                'race_result_id' => 953,
                'time_ms' => 82225,
                'position' => 25,
                ),
                25 =>
                array (
                'race_result_id' => 962,
                'time_ms' => 82230,
                'position' => 26,
                ),
                26 =>
                array (
                'race_result_id' => 969,
                'time_ms' => 82345,
                'position' => 27,
                ),
                27 =>
                array (
                'race_result_id' => 967,
                'time_ms' => 82477,
                'position' => 28,
                ),
                28 =>
                array (
                'race_result_id' => 971,
                'time_ms' => 82609,
                'position' => 29,
                ),
                29 =>
                array (
                'race_result_id' => 968,
                'time_ms' => 82670,
                'position' => 30,
                ),
                30 =>
                array (
                'race_result_id' => 970,
                'time_ms' => 83336,
                'position' => 31,
                ),
                31 =>
                array (
                'race_result_id' => 972,
                'time_ms' => 83685,
                'position' => 32,
                ),
                32 =>
                array (
                'race_result_id' => 974,
                'time_ms' => 83865,
                'position' => 33,
                ),
                33 =>
                array (
                'race_result_id' => 973,
                'time_ms' => 84291,
                'position' => 34,
                ),
                )),
                'created_by_user_id' => 4,
                'created_at' => '2025-12-22 00:01:59',
                'updated_at' => '2025-12-26 06:31:57',
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
                'points_system' => json_encode(array (
            1 => 25,
            2 => 20,
            3 => 16,
            4 => 13,
            5 => 11,
            6 => 10,
            7 => 9,
            8 => 8,
            9 => 7,
            10 => 6,
            11 => 5,
            12 => 4,
            13 => 3,
            14 => 2,
            15 => 1,
            16 => 0,
                )),
                'round_points' => true,
                'status' => 'completed',
                'round_results' => json_encode(array (
        'standings' =>
        array (
        0 =>
        array (
        'division_id' => 1,
        'division_name' => 'Division 1',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 54,
          'driver_name' => 'Rangeraus',
          'race_points' => 35,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 25,
          'total_points' => 25,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 76,
          'driver_name' => 'warrior2167',
          'race_points' => 28,
          'fastest_lap_points' => 1,
          'pole_position_points' => 1,
          'round_points' => 20,
          'total_points' => 22,
          'total_positions_gained' => -2,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 75,
          'driver_name' => 'Viperzed',
          'race_points' => 25.5,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 16,
          'total_points' => 16,
          'total_positions_gained' => 3,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 38,
          'driver_name' => 'JimothyPayload',
          'race_points' => 22.5,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 13,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        ),
        ),
        1 =>
        array (
        'division_id' => 4,
        'division_name' => 'Division 4',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 43,
          'driver_name' => 'Kiwi_kart_racer9',
          'race_points' => 33,
          'fastest_lap_points' => 0,
          'pole_position_points' => 1,
          'round_points' => 25,
          'total_points' => 26,
          'total_positions_gained' => -2,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 31,
          'driver_name' => 'Hatchy3_',
          'race_points' => 26.5,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 20,
          'total_points' => 20,
          'total_positions_gained' => -2,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 34,
          'driver_name' => 'j. Farley',
          'race_points' => 23,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 16,
          'total_points' => 16,
          'total_positions_gained' => 3,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 49,
          'driver_name' => 'Muzzie_013',
          'race_points' => 22.5,
          'fastest_lap_points' => 1,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 14,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        4 =>
        array (
          'position' => 5,
          'driver_id' => 36,
          'driver_name' => 'JC_Blaize',
          'race_points' => 21.5,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 11,
          'total_points' => 11,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        5 =>
        array (
          'position' => 6,
          'driver_id' => 50,
          'driver_name' => 'Natalie WA',
          'race_points' => 15,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 10,
          'total_points' => 10,
          'total_positions_gained' => -6,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        6 =>
        array (
          'position' => 7,
          'driver_id' => 74,
          'driver_name' => 'Vert Wheeler',
          'race_points' => 14,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 9,
          'total_points' => 9,
          'total_positions_gained' => -2,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        7 =>
        array (
          'position' => 8,
          'driver_id' => 45,
          'driver_name' => 'Luppo',
          'race_points' => 4.5,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 8,
          'total_points' => 8,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        ),
        ),
        2 =>
        array (
        'division_id' => 2,
        'division_name' => 'Division 2',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 24,
          'driver_name' => 'DRZ-Hatfield',
          'race_points' => 32.5,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 25,
          'total_points' => 25,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 65,
          'driver_name' => 'Snorxal',
          'race_points' => 25,
          'fastest_lap_points' => 1,
          'pole_position_points' => 1,
          'round_points' => 20,
          'total_points' => 22,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 47,
          'driver_name' => 'Matthyus',
          'race_points' => 24,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 16,
          'total_points' => 16,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 1,
          'driver_name' => 'Alexb8891',
          'race_points' => 18,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 13,
          'total_positions_gained' => 7,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        4 =>
        array (
          'position' => 5,
          'driver_id' => 60,
          'driver_name' => 'Selduin',
          'race_points' => 17.5,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 11,
          'total_points' => 11,
          'total_positions_gained' => -5,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        5 =>
        array (
          'position' => 6,
          'driver_id' => 73,
          'driver_name' => 'UrsineSaturn9',
          'race_points' => 17.5,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 10,
          'total_points' => 10,
          'total_positions_gained' => 3,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        6 =>
        array (
          'position' => 7,
          'driver_id' => 67,
          'driver_name' => 'Stinky',
          'race_points' => 15,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 9,
          'total_points' => 9,
          'total_positions_gained' => -1,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        7 =>
        array (
          'position' => 8,
          'driver_id' => 26,
          'driver_name' => 'E. Presley',
          'race_points' => 14.5,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 8,
          'total_points' => 8,
          'total_positions_gained' => 1,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        8 =>
        array (
          'position' => 9,
          'driver_id' => 40,
          'driver_name' => 'K. Brown',
          'race_points' => 10.5,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 7,
          'total_points' => 7,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        9 =>
        array (
          'position' => 10,
          'driver_id' => 13,
          'driver_name' => 'Bob Massie',
          'race_points' => 9,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 6,
          'total_points' => 6,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        10 =>
        array (
          'position' => 11,
          'driver_id' => 6,
          'driver_name' => 'B. CakePie',
          'race_points' => 6,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 5,
          'total_points' => 5,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        ),
        ),
        3 =>
        array (
        'division_id' => 3,
        'division_name' => 'Division 3',
        'results' =>
        array (
        0 =>
        array (
          'position' => 1,
          'driver_id' => 2,
          'driver_name' => 'anders_race',
          'race_points' => 37.5,
          'fastest_lap_points' => 0,
          'pole_position_points' => 1,
          'round_points' => 25,
          'total_points' => 26,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        1 =>
        array (
          'position' => 2,
          'driver_id' => 66,
          'driver_name' => 'Steve_73_GOOF',
          'race_points' => 25.5,
          'fastest_lap_points' => 1,
          'pole_position_points' => 0,
          'round_points' => 20,
          'total_points' => 21,
          'total_positions_gained' => -2,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        2 =>
        array (
          'position' => 3,
          'driver_id' => 20,
          'driver_name' => 'Dash_Vanguard',
          'race_points' => 21,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 16,
          'total_points' => 16,
          'total_positions_gained' => 3,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        3 =>
        array (
          'position' => 4,
          'driver_id' => 70,
          'driver_name' => 'T-GT Racing',
          'race_points' => 19.5,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 13,
          'total_points' => 13,
          'total_positions_gained' => -7,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        4 =>
        array (
          'position' => 5,
          'driver_id' => 79,
          'driver_name' => 'X-3vi1 m00n',
          'race_points' => 17.5,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 11,
          'total_points' => 11,
          'total_positions_gained' => -3,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        5 =>
        array (
          'position' => 6,
          'driver_id' => 22,
          'driver_name' => 'Donsflyup',
          'race_points' => 16.5,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 10,
          'total_points' => 10,
          'total_positions_gained' => 2,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        6 =>
        array (
          'position' => 7,
          'driver_id' => 69,
          'driver_name' => 'T F Eccles',
          'race_points' => 15,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 9,
          'total_points' => 9,
          'total_positions_gained' => 4,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        7 =>
        array (
          'position' => 8,
          'driver_id' => 68,
          'driver_name' => 'Sylveon with a gun',
          'race_points' => 13,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 8,
          'total_points' => 8,
          'total_positions_gained' => 0,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        8 =>
        array (
          'position' => 9,
          'driver_id' => 28,
          'driver_name' => 'Emmo',
          'race_points' => 13,
          'fastest_lap_points' => 0,
          'pole_position_points' => 0,
          'round_points' => 7,
          'total_points' => 7,
          'total_positions_gained' => 3,
          'has_any_dnf' => false,
          'total_penalties' => '0.000',
        ),
        ),
        ),
                ),
                )),
                'qualifying_results' => json_encode(array (
        0 =>
        array (
        'race_result_id' => 975,
        'time_ms' => 75476,
        'position' => 1,
                ),
                1 =>
                array (
                'race_result_id' => 976,
                'time_ms' => 75534,
                'position' => 2,
                ),
                2 =>
                array (
                'race_result_id' => 977,
                'time_ms' => 75964,
                'position' => 3,
                ),
                3 =>
                array (
                'race_result_id' => 978,
                'time_ms' => 76058,
                'position' => 4,
                ),
                4 =>
                array (
                'race_result_id' => 979,
                'time_ms' => 76198,
                'position' => 5,
                ),
                5 =>
                array (
                'race_result_id' => 989,
                'time_ms' => 76273,
                'position' => 6,
                ),
                6 =>
                array (
                'race_result_id' => 980,
                'time_ms' => 76281,
                'position' => 7,
                ),
                7 =>
                array (
                'race_result_id' => 981,
                'time_ms' => 76322,
                'position' => 8,
                ),
                8 =>
                array (
                'race_result_id' => 982,
                'time_ms' => 76353,
                'position' => 9,
                ),
                9 =>
                array (
                'race_result_id' => 983,
                'time_ms' => 76368,
                'position' => 10,
                ),
                10 =>
                array (
                'race_result_id' => 990,
                'time_ms' => 76524,
                'position' => 11,
                ),
                11 =>
                array (
                'race_result_id' => 984,
                'time_ms' => 76593,
                'position' => 12,
                ),
                12 =>
                array (
                'race_result_id' => 985,
                'time_ms' => 76652,
                'position' => 13,
                ),
                13 =>
                array (
                'race_result_id' => 986,
                'time_ms' => 76699,
                'position' => 14,
                ),
                14 =>
                array (
                'race_result_id' => 991,
                'time_ms' => 76799,
                'position' => 15,
                ),
                15 =>
                array (
                'race_result_id' => 998,
                'time_ms' => 76801,
                'position' => 16,
                ),
                16 =>
                array (
                'race_result_id' => 992,
                'time_ms' => 76803,
                'position' => 17,
                ),
                17 =>
                array (
                'race_result_id' => 993,
                'time_ms' => 76864,
                'position' => 18,
                ),
                18 =>
                array (
                'race_result_id' => 994,
                'time_ms' => 76913,
                'position' => 19,
                ),
                19 =>
                array (
                'race_result_id' => 987,
                'time_ms' => 76944,
                'position' => 20,
                ),
                20 =>
                array (
                'race_result_id' => 995,
                'time_ms' => 77015,
                'position' => 21,
                ),
                21 =>
                array (
                'race_result_id' => 988,
                'time_ms' => 77066,
                'position' => 22,
                ),
                22 =>
                array (
                'race_result_id' => 996,
                'time_ms' => 77168,
                'position' => 23,
                ),
                23 =>
                array (
                'race_result_id' => 999,
                'time_ms' => 77384,
                'position' => 24,
                ),
                24 =>
                array (
                'race_result_id' => 1000,
                'time_ms' => 77423,
                'position' => 25,
                ),
                25 =>
                array (
                'race_result_id' => 997,
                'time_ms' => 77486,
                'position' => 26,
                ),
                26 =>
                array (
                'race_result_id' => 1001,
                'time_ms' => 78374,
                'position' => 27,
                ),
                27 =>
                array (
                'race_result_id' => 1002,
                'time_ms' => 78456,
                'position' => 28,
                ),
                28 =>
                array (
                'race_result_id' => 1003,
                'time_ms' => 78546,
                'position' => 29,
                ),
                29 =>
                array (
                'race_result_id' => 1004,
                'time_ms' => 78692,
                'position' => 30,
                ),
                )),
                'race_time_results' => json_encode(array (
        0 =>
        array (
        'race_result_id' => 1005,
        'time_ms' => 1153105,
        'position' => 1,
                ),
                1 =>
                array (
                'race_result_id' => 1006,
                'time_ms' => 1154114,
                'position' => 2,
                ),
                2 =>
                array (
                'race_result_id' => 1007,
                'time_ms' => 1157525,
                'position' => 3,
                ),
                3 =>
                array (
                'race_result_id' => 1008,
                'time_ms' => 1160392,
                'position' => 4,
                ),
                4 =>
                array (
                'race_result_id' => 1014,
                'time_ms' => 1160878,
                'position' => 5,
                ),
                5 =>
                array (
                'race_result_id' => 1015,
                'time_ms' => 1162387,
                'position' => 6,
                ),
                6 =>
                array (
                'race_result_id' => 1009,
                'time_ms' => 1162439,
                'position' => 7,
                ),
                7 =>
                array (
                'race_result_id' => 1016,
                'time_ms' => 1164624,
                'position' => 8,
                ),
                8 =>
                array (
                'race_result_id' => 1068,
                'time_ms' => 1164721,
                'position' => 9,
                ),
                9 =>
                array (
                'race_result_id' => 1018,
                'time_ms' => 1165221,
                'position' => 10,
                ),
                10 =>
                array (
                'race_result_id' => 1025,
                'time_ms' => 1165422,
                'position' => 11,
                ),
                11 =>
                array (
                'race_result_id' => 1010,
                'time_ms' => 1165680,
                'position' => 12,
                ),
                12 =>
                array (
                'race_result_id' => 1075,
                'time_ms' => 1165750,
                'position' => 13,
                ),
                13 =>
                array (
                'race_result_id' => 1076,
                'time_ms' => 1169034,
                'position' => 14,
                ),
                14 =>
                array (
                'race_result_id' => 1011,
                'time_ms' => 1169187,
                'position' => 15,
                ),
                15 =>
                array (
                'race_result_id' => 1012,
                'time_ms' => 1170157,
                'position' => 16,
                ),
                16 =>
                array (
                'race_result_id' => 1019,
                'time_ms' => 1173200,
                'position' => 17,
                ),
                17 =>
                array (
                'race_result_id' => 1026,
                'time_ms' => 1173282,
                'position' => 18,
                ),
                18 =>
                array (
                'race_result_id' => 1027,
                'time_ms' => 1174832,
                'position' => 19,
                ),
                19 =>
                array (
                'race_result_id' => 1020,
                'time_ms' => 1174875,
                'position' => 20,
                ),
                20 =>
                array (
                'race_result_id' => 1017,
                'time_ms' => 1175374,
                'position' => 21,
                ),
                21 =>
                array (
                'race_result_id' => 1028,
                'time_ms' => 1176889,
                'position' => 22,
                ),
                22 =>
                array (
                'race_result_id' => 1029,
                'time_ms' => 1179117,
                'position' => 23,
                ),
                23 =>
                array (
                'race_result_id' => 1030,
                'time_ms' => 1179463,
                'position' => 24,
                ),
                24 =>
                array (
                'race_result_id' => 1031,
                'time_ms' => 1179868,
                'position' => 25,
                ),
                25 =>
                array (
                'race_result_id' => 1032,
                'time_ms' => 1180979,
                'position' => 26,
                ),
                26 =>
                array (
                'race_result_id' => 1033,
                'time_ms' => 1181489,
                'position' => 27,
                ),
                27 =>
                array (
                'race_result_id' => 1080,
                'time_ms' => 1182494,
                'position' => 28,
                ),
                28 =>
                array (
                'race_result_id' => 1022,
                'time_ms' => 1182836,
                'position' => 29,
                ),
                29 =>
                array (
                'race_result_id' => 1081,
                'time_ms' => 1183638,
                'position' => 30,
                ),
                30 =>
                array (
                'race_result_id' => 1034,
                'time_ms' => 1189521,
                'position' => 31,
                ),
                31 =>
                array (
                'race_result_id' => 1094,
                'time_ms' => 1226630,
                'position' => 32,
                ),
                )),
                'fastest_lap_results' => json_encode(array (
        0 =>
        array (
        'race_result_id' => 1015,
        'time_ms' => 75531,
        'position' => 1,
                ),
                1 =>
                array (
                'race_result_id' => 1014,
                'time_ms' => 75671,
                'position' => 2,
                ),
                2 =>
                array (
                'race_result_id' => 1025,
                'time_ms' => 75904,
                'position' => 3,
                ),
                3 =>
                array (
                'race_result_id' => 1016,
                'time_ms' => 76011,
                'position' => 4,
                ),
                4 =>
                array (
                'race_result_id' => 1028,
                'time_ms' => 76137,
                'position' => 5,
                ),
                5 =>
                array (
                'race_result_id' => 1026,
                'time_ms' => 76173,
                'position' => 6,
                ),
                6 =>
                array (
                'race_result_id' => 1006,
                'time_ms' => 76201,
                'position' => 7,
                ),
                7 =>
                array (
                'race_result_id' => 1017,
                'time_ms' => 76247,
                'position' => 8,
                ),
                8 =>
                array (
                'race_result_id' => 1005,
                'time_ms' => 76378,
                'position' => 9,
                ),
                9 =>
                array (
                'race_result_id' => 1031,
                'time_ms' => 76402,
                'position' => 10,
                ),
                10 =>
                array (
                'race_result_id' => 1027,
                'time_ms' => 76418,
                'position' => 11,
                ),
                11 =>
                array (
                'race_result_id' => 1007,
                'time_ms' => 76479,
                'position' => 12,
                ),
                12 =>
                array (
                'race_result_id' => 1030,
                'time_ms' => 76608,
                'position' => 13,
                ),
                13 =>
                array (
                'race_result_id' => 1033,
                'time_ms' => 76629,
                'position' => 14,
                ),
                14 =>
                array (
                'race_result_id' => 1008,
                'time_ms' => 76632,
                'position' => 15,
                ),
                15 =>
                array (
                'race_result_id' => 1029,
                'time_ms' => 76660,
                'position' => 16,
                ),
                16 =>
                array (
                'race_result_id' => 1035,
                'time_ms' => 76698,
                'position' => 17,
                ),
                17 =>
                array (
                'race_result_id' => 1009,
                'time_ms' => 76702,
                'position' => 18,
                ),
                18 =>
                array (
                'race_result_id' => 1075,
                'time_ms' => 76750,
                'position' => 19,
                ),
                19 =>
                array (
                'race_result_id' => 1032,
                'time_ms' => 76780,
                'position' => 20,
                ),
                20 =>
                array (
                'race_result_id' => 1012,
                'time_ms' => 76897,
                'position' => 21,
                ),
                21 =>
                array (
                'race_result_id' => 1034,
                'time_ms' => 76902,
                'position' => 22,
                ),
                22 =>
                array (
                'race_result_id' => 1076,
                'time_ms' => 76920,
                'position' => 23,
                ),
                23 =>
                array (
                'race_result_id' => 1069,
                'time_ms' => 76931,
                'position' => 24,
                ),
                24 =>
                array (
                'race_result_id' => 1011,
                'time_ms' => 76946,
                'position' => 25,
                ),
                25 =>
                array (
                'race_result_id' => 1068,
                'time_ms' => 76974,
                'position' => 26,
                ),
                26 =>
                array (
                'race_result_id' => 1018,
                'time_ms' => 76982,
                'position' => 27,
                ),
                27 =>
                array (
                'race_result_id' => 1022,
                'time_ms' => 77074,
                'position' => 28,
                ),
                28 =>
                array (
                'race_result_id' => 1020,
                'time_ms' => 77151,
                'position' => 29,
                ),
                29 =>
                array (
                'race_result_id' => 1019,
                'time_ms' => 77286,
                'position' => 30,
                ),
                30 =>
                array (
                'race_result_id' => 1024,
                'time_ms' => 77496,
                'position' => 31,
                ),
                31 =>
                array (
                'race_result_id' => 1081,
                'time_ms' => 77660,
                'position' => 32,
                ),
                )),
                'created_by_user_id' => 4,
                'created_at' => '2025-12-22 00:02:26',
                'updated_at' => '2026-01-01 02:52:41',
            ],
            [
                'id' => 11,
                'season_id' => 7,
                'round_number' => 16,
                'name' => 'vel eligendi enim',
                'slug' => 'praesentium-rerum-ratione-sit-ut-maiores-eius-nesciunt',
                'scheduled_at' => '2026-01-05 03:01:30',
                'timezone' => 'UTC',
                'platform_track_id' => 147,
                'track_layout' => 'Short',
                'track_conditions' => 'Quis sit non dolores sit. Amet doloribus consequatur et et nihil architecto.',
                'technical_notes' => null,
                'stream_url' => null,
                'internal_notes' => 'Reprehenderit atque soluta a quo. Nobis delectus laboriosam qui quia porro ratione saepe. Doloremque aut quis rerum veritatis ex blanditiis quia.',
                'fastest_lap' => null,
                'fastest_lap_top_10' => false,
                'qualifying_pole' => 1,
                'qualifying_pole_top_10' => true,
                'points_system' => null,
                'round_points' => false,
                'status' => 'cancelled',
                'round_results' => null,
                'qualifying_results' => null,
                'race_time_results' => null,
                'fastest_lap_results' => null,
                'created_by_user_id' => 11,
                'created_at' => '2026-01-01 04:37:56',
                'updated_at' => '2026-01-01 04:37:56',
            ],
            [
                'id' => 12,
                'season_id' => 8,
                'round_number' => 11,
                'name' => 'nihil a cum',
                'slug' => 'officia-expedita-unde-aut',
                'scheduled_at' => '2026-06-03 21:13:42',
                'timezone' => 'UTC',
                'platform_track_id' => 148,
                'track_layout' => null,
                'track_conditions' => null,
                'technical_notes' => 'Aut voluptatem ratione sequi nisi reiciendis in voluptas. Exercitationem voluptas voluptate nemo eum ut. Laboriosam autem aliquid quia quia beatae qui. Ad fugiat consequatur eos ab vero hic.',
                'stream_url' => null,
                'internal_notes' => 'Ex tenetur et dicta. Ut ut numquam maiores et fuga et perspiciatis. Sed ullam consectetur recusandae molestiae possimus. Eos ut qui et non ullam.',
                'fastest_lap' => null,
                'fastest_lap_top_10' => false,
                'qualifying_pole' => 3,
                'qualifying_pole_top_10' => true,
                'points_system' => null,
                'round_points' => false,
                'status' => 'completed',
                'round_results' => null,
                'qualifying_results' => null,
                'race_time_results' => null,
                'fastest_lap_results' => null,
                'created_by_user_id' => 14,
                'created_at' => '2026-01-01 04:38:06',
                'updated_at' => '2026-01-01 04:38:06',
            ],
            [
                'id' => 13,
                'season_id' => 9,
                'round_number' => 20,
                'name' => 'nihil est quibusdam',
                'slug' => 'at-et-illum-et-animi-ut-aut-quas',
                'scheduled_at' => '2026-01-18 09:53:09',
                'timezone' => 'UTC',
                'platform_track_id' => 149,
                'track_layout' => 'GP',
                'track_conditions' => 'Saepe assumenda sint numquam occaecati illum. Et pariatur quas at consequatur voluptas sunt ad.',
                'technical_notes' => 'Culpa molestiae ullam incidunt autem iste. Cupiditate quae aut quos laudantium recusandae.',
                'stream_url' => null,
                'internal_notes' => null,
                'fastest_lap' => 3,
                'fastest_lap_top_10' => false,
                'qualifying_pole' => null,
                'qualifying_pole_top_10' => false,
                'points_system' => null,
                'round_points' => false,
                'status' => 'pre_race',
                'round_results' => null,
                'qualifying_results' => null,
                'race_time_results' => null,
                'fastest_lap_results' => null,
                'created_by_user_id' => 16,
                'created_at' => '2026-01-01 04:40:19',
                'updated_at' => '2026-01-01 04:40:19',
            ],
            [
                'id' => 14,
                'season_id' => 10,
                'round_number' => 19,
                'name' => 'impedit alias nisi',
                'slug' => 'cumque-qui-provident-ipsam-dolores',
                'scheduled_at' => '2026-05-14 17:13:33',
                'timezone' => 'UTC',
                'platform_track_id' => 150,
                'track_layout' => 'National',
                'track_conditions' => 'Rerum corporis porro rerum repudiandae voluptas enim. Ut quasi beatae id est iure voluptas eum sed.',
                'technical_notes' => null,
                'stream_url' => 'http://www.dicki.org/est-sint-expedita-est-dolore-necessitatibus-a-et',
                'internal_notes' => null,
                'fastest_lap' => null,
                'fastest_lap_top_10' => false,
                'qualifying_pole' => null,
                'qualifying_pole_top_10' => false,
                'points_system' => null,
                'round_points' => true,
                'status' => 'cancelled',
                'round_results' => null,
                'qualifying_results' => null,
                'race_time_results' => null,
                'fastest_lap_results' => null,
                'created_by_user_id' => 17,
                'created_at' => '2026-01-01 04:40:30',
                'updated_at' => '2026-01-01 04:40:30',
            ],
            [
                'id' => 15,
                'season_id' => 10,
                'round_number' => 10,
                'name' => 'fugiat dolor ut',
                'slug' => 'sed-sed-blanditiis-numquam-consectetur-amet-odio-commodi',
                'scheduled_at' => '2026-06-04 09:48:19',
                'timezone' => 'UTC',
                'platform_track_id' => 150,
                'track_layout' => 'Endurance',
                'track_conditions' => null,
                'technical_notes' => 'Quia earum corrupti vel adipisci repellendus. Ea molestiae expedita optio sint sit expedita architecto. Molestiae sequi aliquam nobis. Non rerum quidem quasi quia.',
                'stream_url' => 'http://www.doyle.com/',
                'internal_notes' => null,
                'fastest_lap' => null,
                'fastest_lap_top_10' => true,
                'qualifying_pole' => null,
                'qualifying_pole_top_10' => false,
                'points_system' => null,
                'round_points' => true,
                'status' => 'pre_race',
                'round_results' => null,
                'qualifying_results' => null,
                'race_time_results' => null,
                'fastest_lap_results' => null,
                'created_by_user_id' => 17,
                'created_at' => '2026-01-01 04:40:30',
                'updated_at' => '2026-01-01 04:40:30',
            ],
        ];

        foreach ($rounds as $roundsData) {
            Round::updateOrCreate(
                ['id' => $roundsData['id']],
                $roundsData
            );
        }

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info('RoundsBackupSeeder seeded successfully. Total records: ' . count($rounds));
    }
}

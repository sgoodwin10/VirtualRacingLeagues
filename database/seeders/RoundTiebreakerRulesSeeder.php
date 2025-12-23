<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Round Tiebreaker Rules Seeder.
 *
 * Seeds the default tiebreaker rules for resolving ties in round totals.
 */
final class RoundTiebreakerRulesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rules = [
            [
                'name' => 'Highest Qualifying Position',
                'slug' => 'highest-qualifying-position',
                'description' => 'Driver with the higher qualifying position wins the tiebreaker. Compares the best qualifying result from all qualifying races in the round.',
                'is_active' => true,
                'default_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Race 1 Best Result',
                'slug' => 'race-1-best-result',
                'description' => 'Driver with the better Race 1 finish wins the tiebreaker. Only considers the first main race (Race 1), not qualifying races.',
                'is_active' => true,
                'default_order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Best Result from All Races',
                'slug' => 'best-result-all-races',
                'description' => 'Countback through all main races (excluding qualifying) - best single finish, then second-best, etc. Driver with better results in this comparison wins the tiebreaker.',
                'is_active' => true,
                'default_order' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        // Insert rules
        DB::table('round_tiebreaker_rules')->insert($rules);

        $this->command->info('Round tiebreaker rules seeded successfully.');
    }
}

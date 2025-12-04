<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use Illuminate\Database\Seeder;

class CompetitionSeeder extends Seeder
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
            $this->command->error('CompetitionSeeder cannot run in production environment!');
            return;
        }

        // Create the competition (ID 1)
        Competition::firstOrCreate(
            ['id' => 1],
            [
                'league_id' => 1,
                'platform_id' => 1,
                'created_by_user_id' => 1,
                'name' => 'Sunday Nights',
                'slug' => 'sunday-nights',
                'description' => null,
                'logo_path' => null,
                'competition_colour' => json_encode(['r' => 188, 'g' => 67, 'b' => 186]),
                'status' => 'active',
                'archived_at' => null,
                'created_at' => '2025-11-27 11:25:50',
                'updated_at' => '2025-11-27 11:25:50',
            ]
        );

        $this->command->info('Competition seeded successfully.');
    }
}

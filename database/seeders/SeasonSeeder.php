<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use Illuminate\Database\Seeder;

class SeasonSeeder extends Seeder
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
            $this->command->error('SeasonSeeder cannot run in production environment!');
            return;
        }

        // Create the season (ID 4)
        SeasonEloquent::firstOrCreate(
            ['id' => 4],
            [
                'competition_id' => 1,
                'name' => 'Season 1',
                'slug' => 'season-1',
                'car_class' => null,
                'description' => null,
                'technical_specs' => null,
                'logo_path' => null,
                'banner_path' => null,
                'team_championship_enabled' => true,
                'race_divisions_enabled' => true,
                'race_times_required' => true,
                'status' => 'active',
                'created_by_user_id' => 1,
                'created_at' => '2025-11-27 11:32:10',
                'updated_at' => '2025-12-01 13:12:41',
            ]
        );

        $this->command->info('Season seeded successfully.');
    }
}

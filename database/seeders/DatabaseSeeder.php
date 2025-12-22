<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Production-required seeders (platform data)
        $this->call([
            AdminSeeder::class,
            PlatformSeeder::class,
            PlatformTrackLocationSeeder::class,
            PlatformTrackSeeder::class,
        ]);

        // Development-only seeders (test data)
        // IMPORTANT: These seeders will ONLY run in local/development/testing environments
        if (app()->environment('local', 'development', 'testing')) {
            $this->call([
                // Core configuration and users
                SiteConfigSeeder::class,
                UserSeeder::class,

                // League structure (must be in this order due to foreign key dependencies)
                LeagueSeeder::class,
                DriverSeeder::class,
                CompetitionSeeder::class,
                // SeasonSeeder::class,
                // DivisionSeeder::class,
                // RoundSeeder::class,
                // RaceSeeder::class
            ]);
        }
    }
}

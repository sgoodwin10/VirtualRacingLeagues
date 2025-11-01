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
        if (app()->environment('local', 'development', 'testing')) {
            $this->call([
                SiteConfigSeeder::class,
                UserSeeder::class,
                LeagueSeeder::class,
                DriverSeeder::class,
            ]);
        }
    }
}

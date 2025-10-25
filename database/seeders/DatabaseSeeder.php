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
        $this->call([
            SiteConfigSeeder::class,
            AdminSeeder::class,
            UserSeeder::class,
            PlatformSeeder::class,
            PlatformTrackLocationSeeder::class,
            PlatformTrackSeeder::class,
            LeagueSeeder::class,
            DriverSeeder::class,
        ]);
    }
}

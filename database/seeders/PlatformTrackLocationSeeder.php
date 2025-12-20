<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PlatformTrackLocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('platform_track_locations')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Get Gran Turismo 7 platform ID
        $gt7Platform = DB::table('platforms')->where('slug', 'gran-turismo-7')->first();

        if (!$gt7Platform) {
            $this->command->error('Gran Turismo 7 platform not found. Please run PlatformSeeder first.');
            return;
        }

        $locations = [
            // European Tracks - Real Circuits
            ['name' => 'Brands Hatch', 'country' => 'United Kingdom', 'sort_order' => 1],
            ['name' => 'Goodwood Motor Circuit', 'country' => 'United Kingdom', 'sort_order' => 2],
            ['name' => 'Circuit de Spa-Francorchamps', 'country' => 'Belgium', 'sort_order' => 3],
            ['name' => 'Autodromo Nazionale Monza', 'country' => 'Italy', 'sort_order' => 4],
            ['name' => 'Circuit de Barcelona-Catalunya', 'country' => 'Spain', 'sort_order' => 5],
            ['name' => 'Nürburgring', 'country' => 'Germany', 'sort_order' => 6],
            ['name' => 'Red Bull Ring', 'country' => 'Austria', 'sort_order' => 7],
            ['name' => '24 Heures du Mans Racing Circuit', 'country' => 'France', 'sort_order' => 8],

            // European Tracks - Fictional/Original
            ['name' => 'Alsace', 'country' => 'France', 'sort_order' => 9],
            ['name' => 'Circuit de Sainte-Croix', 'country' => 'France', 'sort_order' => 10],
            ['name' => 'Autodrome Lago Maggiore', 'country' => 'Italy', 'sort_order' => 11],
            ['name' => 'Sardegna - Road Track', 'country' => 'Italy', 'sort_order' => 12],
            ['name' => 'Sardegna - Windmills', 'country' => 'Italy', 'sort_order' => 13],
            ['name' => 'Eiger Nordwand', 'country' => 'Switzerland', 'sort_order' => 14],
            ['name' => 'Deep Forest Raceway', 'country' => 'Switzerland', 'sort_order' => 15],
            ['name' => 'Dragon Trail', 'country' => 'Croatia', 'sort_order' => 16],

            // Asian/Pacific Tracks - Real Circuits
            ['name' => 'Suzuka Circuit', 'country' => 'Japan', 'sort_order' => 17],
            ['name' => 'Fuji International Speedway', 'country' => 'Japan', 'sort_order' => 18],
            ['name' => 'Autopolis International Racing Course', 'country' => 'Japan', 'sort_order' => 19],
            ['name' => 'Tsukuba Circuit', 'country' => 'Japan', 'sort_order' => 20],
            ['name' => 'Mount Panorama Circuit', 'country' => 'Australia', 'sort_order' => 21],
            ['name' => 'Yas Marina Circuit', 'country' => 'United Arab Emirates', 'sort_order' => 22],

            // Asian/Pacific Tracks - Fictional/Original
            ['name' => 'Tokyo Expressway', 'country' => 'Japan', 'sort_order' => 23],
            ['name' => 'Kyoto Driving Park', 'country' => 'Japan', 'sort_order' => 24],
            ['name' => 'Broad Bean Raceway', 'country' => 'Japan', 'sort_order' => 25],
            ['name' => 'High Speed Ring', 'country' => 'Japan', 'sort_order' => 26],

            // North American Tracks - Real Circuits
            ['name' => 'WeatherTech Raceway Laguna Seca', 'country' => 'United States', 'sort_order' => 27],
            ['name' => 'Daytona International Speedway', 'country' => 'United States', 'sort_order' => 28],
            ['name' => 'Willow Springs International Raceway', 'country' => 'United States', 'sort_order' => 29],
            ['name' => 'Michelin Raceway Road Atlanta', 'country' => 'United States', 'sort_order' => 30],
            ['name' => 'Watkins Glen International', 'country' => 'United States', 'sort_order' => 31],
            ['name' => 'Circuit Gilles-Villeneuve', 'country' => 'Canada', 'sort_order' => 32],

            // North American Tracks - Fictional/Original
            ['name' => 'Blue Moon Bay Speedway', 'country' => 'United States', 'sort_order' => 33],
            ['name' => 'Northern Isle Speedway', 'country' => 'United States', 'sort_order' => 34],
            ['name' => 'Grand Valley', 'country' => 'United States', 'sort_order' => 35],
            ['name' => 'Trial Mountain Circuit', 'country' => 'United States', 'sort_order' => 36],
            ['name' => 'Special Stage Route X', 'country' => 'United States', 'sort_order' => 37],
            ['name' => 'Colorado Springs', 'country' => 'United States', 'sort_order' => 38],
            ['name' => 'Fishermans Ranch', 'country' => 'United States', 'sort_order' => 39],
            ['name' => 'Lake Louise', 'country' => 'Canada', 'sort_order' => 40],

            // South American Tracks
            ['name' => 'Autódromo de Interlagos', 'country' => 'Brazil', 'sort_order' => 41],
        ];

        foreach ($locations as $location) {
            DB::table('platform_track_locations')->insert([
                'platform_id' => $gt7Platform->id,
                'name' => $location['name'],
                'slug' => Str::slug($location['name']),
                'country' => $location['country'],
                'is_active' => true,
                'sort_order' => $location['sort_order'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}

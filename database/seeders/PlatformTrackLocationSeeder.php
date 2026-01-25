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

        if (! $gt7Platform) {
            $this->command->error('Gran Turismo 7 platform not found. Please run PlatformSeeder first.');

            return;
        }

        $locations = [
            // European Tracks - Real Circuits
            ['id' => 1, 'name' => 'Brands Hatch', 'country' => 'United Kingdom', 'sort_order' => 1],
            ['id' => 2, 'name' => 'Goodwood Motor Circuit', 'country' => 'United Kingdom', 'sort_order' => 2],
            ['id' => 3, 'name' => 'Circuit de Spa-Francorchamps', 'country' => 'Belgium', 'sort_order' => 3],
            ['id' => 4, 'name' => 'Autodromo Nazionale Monza', 'country' => 'Italy', 'sort_order' => 4],
            ['id' => 5, 'name' => 'Circuit de Barcelona-Catalunya', 'country' => 'Spain', 'sort_order' => 5],
            ['id' => 6, 'name' => 'Nürburgring', 'country' => 'Germany', 'sort_order' => 6],
            ['id' => 7, 'name' => 'Red Bull Ring', 'country' => 'Austria', 'sort_order' => 7],
            ['id' => 8, 'name' => '24 Heures du Mans Racing Circuit', 'country' => 'France', 'sort_order' => 8],

            // European Tracks - Fictional/Original
            ['id' => 9, 'name' => 'Alsace', 'country' => 'France', 'sort_order' => 9],
            ['id' => 10, 'name' => 'Circuit de Sainte-Croix', 'country' => 'France', 'sort_order' => 10],
            ['id' => 11, 'name' => 'Autodrome Lago Maggiore', 'country' => 'Italy', 'sort_order' => 11],
            ['id' => 12, 'name' => 'Sardegna - Road Track', 'country' => 'Italy', 'sort_order' => 12],
            ['id' => 13, 'name' => 'Sardegna - Windmills', 'country' => 'Italy', 'sort_order' => 13],
            ['id' => 14, 'name' => 'Eiger Nordwand', 'country' => 'Switzerland', 'sort_order' => 14],
            ['id' => 15, 'name' => 'Deep Forest Raceway', 'country' => 'Switzerland', 'sort_order' => 15],
            ['id' => 16, 'name' => 'Dragon Trail', 'country' => 'Croatia', 'sort_order' => 16],

            // Asian/Pacific Tracks - Real Circuits
            ['id' => 17, 'name' => 'Suzuka Circuit', 'country' => 'Japan', 'sort_order' => 17],
            ['id' => 18, 'name' => 'Fuji International Speedway', 'country' => 'Japan', 'sort_order' => 18],
            ['id' => 19, 'name' => 'Autopolis International Racing Course', 'country' => 'Japan', 'sort_order' => 19],
            ['id' => 20, 'name' => 'Tsukuba Circuit', 'country' => 'Japan', 'sort_order' => 20],
            ['id' => 21, 'name' => 'Mount Panorama Circuit', 'country' => 'Australia', 'sort_order' => 21],
            ['id' => 22, 'name' => 'Yas Marina Circuit', 'country' => 'United Arab Emirates', 'sort_order' => 22],

            // Asian/Pacific Tracks - Fictional/Original
            ['id' => 23, 'name' => 'Tokyo Expressway', 'country' => 'Japan', 'sort_order' => 23],
            ['id' => 24, 'name' => 'Kyoto Driving Park', 'country' => 'Japan', 'sort_order' => 24],
            ['id' => 25, 'name' => 'Broad Bean Raceway', 'country' => 'Japan', 'sort_order' => 25],
            ['id' => 26, 'name' => 'High Speed Ring', 'country' => 'Japan', 'sort_order' => 26],

            // North American Tracks - Real Circuits
            ['id' => 27, 'name' => 'WeatherTech Raceway Laguna Seca', 'country' => 'United States', 'sort_order' => 27],
            ['id' => 28, 'name' => 'Daytona International Speedway', 'country' => 'United States', 'sort_order' => 28],
            ['id' => 29, 'name' => 'Willow Springs International Raceway', 'country' => 'United States', 'sort_order' => 29],
            ['id' => 30, 'name' => 'Michelin Raceway Road Atlanta', 'country' => 'United States', 'sort_order' => 30],
            ['id' => 31, 'name' => 'Watkins Glen International', 'country' => 'United States', 'sort_order' => 31],
            ['id' => 32, 'name' => 'Circuit Gilles-Villeneuve', 'country' => 'Canada', 'sort_order' => 32],

            // North American Tracks - Fictional/Original
            ['id' => 33, 'name' => 'Blue Moon Bay Speedway', 'country' => 'United States', 'sort_order' => 33],
            ['id' => 34, 'name' => 'Northern Isle Speedway', 'country' => 'United States', 'sort_order' => 34],
            ['id' => 35, 'name' => 'Grand Valley', 'country' => 'United States', 'sort_order' => 35],
            ['id' => 36, 'name' => 'Trial Mountain Circuit', 'country' => 'United States', 'sort_order' => 36],
            ['id' => 37, 'name' => 'Special Stage Route X', 'country' => 'United States', 'sort_order' => 37],
            ['id' => 38, 'name' => 'Colorado Springs', 'country' => 'United States', 'sort_order' => 38],
            ['id' => 39, 'name' => 'Fishermans Ranch', 'country' => 'United States', 'sort_order' => 39],
            ['id' => 40, 'name' => 'Lake Louise', 'country' => 'Canada', 'sort_order' => 40],

            // South American Tracks
            ['id' => 41, 'name' => 'Autódromo de Interlagos', 'country' => 'Brazil', 'sort_order' => 41],
        ];

        foreach ($locations as $location) {
            DB::table('platform_track_locations')->insert([
                'id' => $location['id'],
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

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
        DB::table('platform_track_locations')->truncate();

        $locations = [
            // European Tracks
            ['name' => 'Brands Hatch', 'country' => 'United Kingdom', 'sort_order' => 1],
            ['name' => 'Circuit de Spa-Francorchamps', 'country' => 'Belgium', 'sort_order' => 2],
            ['name' => 'Autodromo Nazionale Monza', 'country' => 'Italy', 'sort_order' => 3],
            ['name' => 'Circuit de Barcelona-Catalunya', 'country' => 'Spain', 'sort_order' => 4],
            ['name' => 'Nürburgring', 'country' => 'Germany', 'sort_order' => 5],
            ['name' => 'Red Bull Ring', 'country' => 'Austria', 'sort_order' => 6],
            ['name' => 'Circuit de la Sarthe', 'country' => 'France', 'sort_order' => 7],
            ['name' => 'Autodrome Lago Maggiore', 'country' => 'Italy', 'sort_order' => 8],
            ['name' => 'Circuit de Sainte-Croix', 'country' => 'France', 'sort_order' => 9],
            ['name' => 'Goodwood Motor Circuit', 'country' => 'United Kingdom', 'sort_order' => 10],

            // Asian/Pacific Tracks
            ['name' => 'Suzuka Circuit', 'country' => 'Japan', 'sort_order' => 11],
            ['name' => 'Fuji Speedway', 'country' => 'Japan', 'sort_order' => 12],
            ['name' => 'Tokyo Expressway', 'country' => 'Japan', 'sort_order' => 13],
            ['name' => 'Autopolis', 'country' => 'Japan', 'sort_order' => 14],
            ['name' => 'Mount Panorama Circuit', 'country' => 'Australia', 'sort_order' => 15],

            // North American Tracks
            ['name' => 'WeatherTech Raceway Laguna Seca', 'country' => 'United States', 'sort_order' => 16],
            ['name' => 'Daytona International Speedway', 'country' => 'United States', 'sort_order' => 17],
            ['name' => 'Willow Springs International Raceway', 'country' => 'United States', 'sort_order' => 18],
            ['name' => 'Circuit of the Americas', 'country' => 'United States', 'sort_order' => 19],
            ['name' => 'Mazda Raceway', 'country' => 'United States', 'sort_order' => 20],
            ['name' => 'Watkins Glen International', 'country' => 'United States', 'sort_order' => 21],

            // Fictional GT Tracks
            ['name' => 'Dragon Trail', 'country' => 'Croatia', 'sort_order' => 22],
            ['name' => 'Blue Moon Bay Speedway', 'country' => 'United States', 'sort_order' => 23],
            ['name' => 'Northern Isle Speedway', 'country' => 'United Kingdom', 'sort_order' => 24],
            ['name' => 'Alsace', 'country' => 'France', 'sort_order' => 25],
            ['name' => 'Kyoto Driving Park', 'country' => 'Japan', 'sort_order' => 26],
            ['name' => 'Broad Bean Raceway', 'country' => 'Japan', 'sort_order' => 27],
            ['name' => 'High Speed Ring', 'country' => 'Japan', 'sort_order' => 28],
            ['name' => 'Trial Mountain', 'country' => 'United States', 'sort_order' => 29],
            ['name' => 'Deep Forest Raceway', 'country' => 'United States', 'sort_order' => 30],
        ];

        foreach ($locations as $location) {
            DB::table('platform_track_locations')->insert([
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

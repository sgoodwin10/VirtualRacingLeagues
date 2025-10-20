<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PlatformTrackSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('platform_tracks')->truncate();

        // Get Gran Turismo 7 platform ID
        $gt7Platform = DB::table('platforms')->where('slug', 'gran-turismo-7')->first();

        if (!$gt7Platform) {
            $this->command->error('Gran Turismo 7 platform not found. Please run PlatformSeeder first.');
            return;
        }

        $platformId = $gt7Platform->id;

        // Helper function to get location ID by slug
        $getLocationId = function ($slug) {
            $location = DB::table('platform_track_locations')->where('slug', $slug)->first();
            return $location ? $location->id : null;
        };

        $tracks = [
            // Brands Hatch
            ['location' => 'brands-hatch', 'name' => 'Grand Prix Circuit', 'is_reverse' => false, 'length' => 3908],
            ['location' => 'brands-hatch', 'name' => 'Indy Circuit', 'is_reverse' => false, 'length' => 1929],

            // Spa-Francorchamps
            ['location' => 'circuit-de-spa-francorchamps', 'name' => 'Grand Prix Circuit', 'is_reverse' => false, 'length' => 7004],

            // Monza
            ['location' => 'autodromo-nazionale-monza', 'name' => 'Grand Prix Circuit', 'is_reverse' => false, 'length' => 5793],
            ['location' => 'autodromo-nazionale-monza', 'name' => 'No Chicane', 'is_reverse' => false, 'length' => 5793],

            // Barcelona
            ['location' => 'circuit-de-barcelona-catalunya', 'name' => 'Grand Prix Layout', 'is_reverse' => false, 'length' => 4675],
            ['location' => 'circuit-de-barcelona-catalunya', 'name' => 'National Layout', 'is_reverse' => false, 'length' => 2894],

            // Nürburgring
            ['location' => 'nurburgring', 'name' => 'Grand Prix Circuit', 'is_reverse' => false, 'length' => 5137],
            ['location' => 'nurburgring', 'name' => 'Nordschleife', 'is_reverse' => false, 'length' => 20832],
            ['location' => 'nurburgring', 'name' => '24h Layout', 'is_reverse' => false, 'length' => 25378],

            // Red Bull Ring
            ['location' => 'red-bull-ring', 'name' => 'Grand Prix Circuit', 'is_reverse' => false, 'length' => 4318],

            // Le Mans
            ['location' => 'circuit-de-la-sarthe', 'name' => '24 Hours Layout', 'is_reverse' => false, 'length' => 13626],
            ['location' => 'circuit-de-la-sarthe', 'name' => '24 Hours Layout - No Chicane', 'is_reverse' => false, 'length' => 13626],

            // Lago Maggiore (Fictional)
            ['location' => 'autodrome-lago-maggiore', 'name' => 'Grand Prix Circuit', 'is_reverse' => false, 'length' => 5548],
            ['location' => 'autodrome-lago-maggiore', 'name' => 'Grand Prix Circuit - Reverse', 'is_reverse' => true, 'length' => 5548],
            ['location' => 'autodrome-lago-maggiore', 'name' => 'Center', 'is_reverse' => false, 'length' => 2997],
            ['location' => 'autodrome-lago-maggiore', 'name' => 'Center - Reverse', 'is_reverse' => true, 'length' => 2997],
            ['location' => 'autodrome-lago-maggiore', 'name' => 'East', 'is_reverse' => false, 'length' => 3476],
            ['location' => 'autodrome-lago-maggiore', 'name' => 'East - Reverse', 'is_reverse' => true, 'length' => 3476],
            ['location' => 'autodrome-lago-maggiore', 'name' => 'West', 'is_reverse' => false, 'length' => 3478],
            ['location' => 'autodrome-lago-maggiore', 'name' => 'West - Reverse', 'is_reverse' => true, 'length' => 3478],

            // Suzuka
            ['location' => 'suzuka-circuit', 'name' => 'Grand Prix Circuit', 'is_reverse' => false, 'length' => 5807],
            ['location' => 'suzuka-circuit', 'name' => 'East Course', 'is_reverse' => false, 'length' => 2243],
            ['location' => 'suzuka-circuit', 'name' => 'West Course', 'is_reverse' => false, 'length' => 3475],

            // Fuji Speedway
            ['location' => 'fuji-speedway', 'name' => 'Grand Prix Circuit', 'is_reverse' => false, 'length' => 4563],

            // Tokyo Expressway (Fictional)
            ['location' => 'tokyo-expressway', 'name' => 'Central Outer Loop', 'is_reverse' => false, 'length' => 3276],
            ['location' => 'tokyo-expressway', 'name' => 'Central Inner Loop', 'is_reverse' => false, 'length' => 3276],
            ['location' => 'tokyo-expressway', 'name' => 'East Outer Loop', 'is_reverse' => false, 'length' => 4100],
            ['location' => 'tokyo-expressway', 'name' => 'East Inner Loop', 'is_reverse' => false, 'length' => 4100],
            ['location' => 'tokyo-expressway', 'name' => 'South Outer Loop', 'is_reverse' => false, 'length' => 3673],
            ['location' => 'tokyo-expressway', 'name' => 'South Inner Loop', 'is_reverse' => false, 'length' => 3673],

            // Autopolis
            ['location' => 'autopolis', 'name' => 'Lakeside', 'is_reverse' => false, 'length' => 4674],

            // Mount Panorama (Bathurst)
            ['location' => 'mount-panorama-circuit', 'name' => 'Motor Racing Circuit', 'is_reverse' => false, 'length' => 6213],

            // Laguna Seca
            ['location' => 'weathertech-raceway-laguna-seca', 'name' => 'Grand Prix Circuit', 'is_reverse' => false, 'length' => 3602],

            // Daytona
            ['location' => 'daytona-international-speedway', 'name' => 'Road Course', 'is_reverse' => false, 'length' => 5729],
            ['location' => 'daytona-international-speedway', 'name' => 'Oval', 'is_reverse' => false, 'length' => 4023],

            // Willow Springs
            ['location' => 'willow-springs-international-raceway', 'name' => 'Big Willow', 'is_reverse' => false, 'length' => 3998],
            ['location' => 'willow-springs-international-raceway', 'name' => 'Streets of Willow Springs', 'is_reverse' => false, 'length' => 2414],
            ['location' => 'willow-springs-international-raceway', 'name' => 'Horse Thief Mile', 'is_reverse' => false, 'length' => 1609],

            // Circuit of the Americas
            ['location' => 'circuit-of-the-americas', 'name' => 'Grand Prix Circuit', 'is_reverse' => false, 'length' => 5513],

            // Watkins Glen
            ['location' => 'watkins-glen-international', 'name' => 'Grand Prix Circuit', 'is_reverse' => false, 'length' => 5430],

            // Dragon Trail (Fictional)
            ['location' => 'dragon-trail', 'name' => 'Seaside', 'is_reverse' => false, 'length' => 4810],
            ['location' => 'dragon-trail', 'name' => 'Seaside - Reverse', 'is_reverse' => true, 'length' => 4810],
            ['location' => 'dragon-trail', 'name' => 'Gardens', 'is_reverse' => false, 'length' => 3676],
            ['location' => 'dragon-trail', 'name' => 'Gardens - Reverse', 'is_reverse' => true, 'length' => 3676],

            // Blue Moon Bay (Fictional)
            ['location' => 'blue-moon-bay-speedway', 'name' => 'Speedway', 'is_reverse' => false, 'length' => 3214],
            ['location' => 'blue-moon-bay-speedway', 'name' => 'Speedway - Reverse', 'is_reverse' => true, 'length' => 3214],
            ['location' => 'blue-moon-bay-speedway', 'name' => 'Infield A', 'is_reverse' => false, 'length' => 4193],
            ['location' => 'blue-moon-bay-speedway', 'name' => 'Infield B', 'is_reverse' => false, 'length' => 2938],

            // Northern Isle (Fictional)
            ['location' => 'northern-isle-speedway', 'name' => 'Speedway', 'is_reverse' => false, 'length' => 3276],
            ['location' => 'northern-isle-speedway', 'name' => 'Infield', 'is_reverse' => false, 'length' => 2745],

            // Alsace (Fictional)
            ['location' => 'alsace', 'name' => 'Village', 'is_reverse' => false, 'length' => 3850],
            ['location' => 'alsace', 'name' => 'Village - Reverse', 'is_reverse' => true, 'length' => 3850],

            // Kyoto Driving Park (Fictional)
            ['location' => 'kyoto-driving-park', 'name' => 'Yamagiwa', 'is_reverse' => false, 'length' => 2963],
            ['location' => 'kyoto-driving-park', 'name' => 'Yamagiwa - Reverse', 'is_reverse' => true, 'length' => 2963],
            ['location' => 'kyoto-driving-park', 'name' => 'Miyabi', 'is_reverse' => false, 'length' => 4092],
            ['location' => 'kyoto-driving-park', 'name' => 'Miyabi - Reverse', 'is_reverse' => true, 'length' => 4092],

            // Broad Bean Raceway (Fictional)
            ['location' => 'broad-bean-raceway', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 2097],

            // High Speed Ring (Fictional)
            ['location' => 'high-speed-ring', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 4000],
            ['location' => 'high-speed-ring', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 4000],

            // Trial Mountain (Fictional)
            ['location' => 'trial-mountain', 'name' => 'Circuit', 'is_reverse' => false, 'length' => 3965],
            ['location' => 'trial-mountain', 'name' => 'Circuit - Reverse', 'is_reverse' => true, 'length' => 3965],

            // Deep Forest (Fictional)
            ['location' => 'deep-forest-raceway', 'name' => 'Raceway', 'is_reverse' => false, 'length' => 3590],
            ['location' => 'deep-forest-raceway', 'name' => 'Raceway - Reverse', 'is_reverse' => true, 'length' => 3590],
        ];

        $sortOrder = 1;
        foreach ($tracks as $track) {
            $locationId = $getLocationId($track['location']);

            if (!$locationId) {
                $this->command->warn("Location '{$track['location']}' not found, skipping track '{$track['name']}'");
                continue;
            }

            DB::table('platform_tracks')->insert([
                'platform_id' => $platformId,
                'platform_track_location_id' => $locationId,
                'name' => $track['name'],
                'slug' => Str::slug($track['name']),
                'is_reverse' => $track['is_reverse'],
                'length_meters' => $track['length'],
                'is_active' => true,
                'sort_order' => $sortOrder++,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info("Seeded " . count($tracks) . " Gran Turismo 7 tracks successfully!");
    }
}

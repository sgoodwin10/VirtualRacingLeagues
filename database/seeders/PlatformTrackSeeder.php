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
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('platform_tracks')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

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
            ['location' => 'brands-hatch', 'name' => 'Grand Prix Circuit', 'is_reverse' => false, 'length' => 3946],
            ['location' => 'brands-hatch', 'name' => 'Grand Prix Circuit - Reverse', 'is_reverse' => true, 'length' => 3946],
            ['location' => 'brands-hatch', 'name' => 'Indy Circuit', 'is_reverse' => false, 'length' => 1944],
            ['location' => 'brands-hatch', 'name' => 'Indy Circuit - Reverse', 'is_reverse' => true, 'length' => 1944],

            // Goodwood Motor Circuit
            ['location' => 'goodwood-motor-circuit', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 3809],
            ['location' => 'goodwood-motor-circuit', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 3809],

            // Spa-Francorchamps
            ['location' => 'circuit-de-spa-francorchamps', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 7044],
            ['location' => 'circuit-de-spa-francorchamps', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 7044],
            ['location' => 'circuit-de-spa-francorchamps', 'name' => '24h Layout', 'is_reverse' => false, 'length' => 7044],

            // Monza
            ['location' => 'autodromo-nazionale-monza', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 5793],
            ['location' => 'autodromo-nazionale-monza', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 5793],
            ['location' => 'autodromo-nazionale-monza', 'name' => 'No Chicane', 'is_reverse' => false, 'length' => 5755],
            ['location' => 'autodromo-nazionale-monza', 'name' => 'No Chicane - Reverse', 'is_reverse' => true, 'length' => 5755],

            // Barcelona-Catalunya
            ['location' => 'circuit-de-barcelona-catalunya', 'name' => 'Grand Prix Layout', 'is_reverse' => false, 'length' => 4655],
            ['location' => 'circuit-de-barcelona-catalunya', 'name' => 'Grand Prix Layout - Reverse', 'is_reverse' => true, 'length' => 4655],
            ['location' => 'circuit-de-barcelona-catalunya', 'name' => 'Grand Prix Layout No Chicane', 'is_reverse' => false, 'length' => 4675],
            ['location' => 'circuit-de-barcelona-catalunya', 'name' => 'National Layout', 'is_reverse' => false, 'length' => 3000],
            ['location' => 'circuit-de-barcelona-catalunya', 'name' => 'National Layout - Reverse', 'is_reverse' => true, 'length' => 3000],
            ['location' => 'circuit-de-barcelona-catalunya', 'name' => 'Rallycross Layout', 'is_reverse' => false, 'length' => 1133],

            // Nürburgring
            ['location' => 'nurburgring', 'name' => 'Nordschleife', 'is_reverse' => false, 'length' => 20832],
            ['location' => 'nurburgring', 'name' => 'Nordschleife Tourist', 'is_reverse' => false, 'length' => 20832],
            ['location' => 'nurburgring', 'name' => '24h Layout', 'is_reverse' => false, 'length' => 25378],
            ['location' => 'nurburgring', 'name' => 'Grand Prix Circuit', 'is_reverse' => false, 'length' => 5137],
            ['location' => 'nurburgring', 'name' => 'Grand Prix Circuit - Reverse', 'is_reverse' => true, 'length' => 5137],
            ['location' => 'nurburgring', 'name' => 'Sprint', 'is_reverse' => false, 'length' => 3629],
            ['location' => 'nurburgring', 'name' => 'Sprint - Reverse', 'is_reverse' => true, 'length' => 3629],
            ['location' => 'nurburgring', 'name' => 'Endurance', 'is_reverse' => false, 'length' => 23900],

            // Red Bull Ring
            ['location' => 'red-bull-ring', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 4318],
            ['location' => 'red-bull-ring', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 4318],
            ['location' => 'red-bull-ring', 'name' => 'Short Track', 'is_reverse' => false, 'length' => 2336],
            ['location' => 'red-bull-ring', 'name' => 'Short Track - Reverse', 'is_reverse' => true, 'length' => 2336],

            // 24 Heures du Mans (Circuit de la Sarthe)
            ['location' => '24-heures-du-mans-racing-circuit', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 13629],
            ['location' => '24-heures-du-mans-racing-circuit', 'name' => 'No Chicane', 'is_reverse' => false, 'length' => 13567],

            // Alsace (Fictional)
            ['location' => 'alsace', 'name' => 'Village', 'is_reverse' => false, 'length' => 5423],
            ['location' => 'alsace', 'name' => 'Village - Reverse', 'is_reverse' => true, 'length' => 5423],
            ['location' => 'alsace', 'name' => 'Test Course', 'is_reverse' => false, 'length' => 2118],

            // Circuit de Sainte-Croix (Fictional)
            ['location' => 'circuit-de-sainte-croix', 'name' => 'Layout A', 'is_reverse' => false, 'length' => 9477],
            ['location' => 'circuit-de-sainte-croix', 'name' => 'Layout A - Reverse', 'is_reverse' => true, 'length' => 9477],
            ['location' => 'circuit-de-sainte-croix', 'name' => 'Layout B', 'is_reverse' => false, 'length' => 7107],
            ['location' => 'circuit-de-sainte-croix', 'name' => 'Layout B - Reverse', 'is_reverse' => true, 'length' => 7107],
            ['location' => 'circuit-de-sainte-croix', 'name' => 'Layout C', 'is_reverse' => false, 'length' => 10825],
            ['location' => 'circuit-de-sainte-croix', 'name' => 'Layout C - Reverse', 'is_reverse' => true, 'length' => 10825],

            // Autodrome Lago Maggiore (Fictional)
            ['location' => 'autodrome-lago-maggiore', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 5809],
            ['location' => 'autodrome-lago-maggiore', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 5809],
            ['location' => 'autodrome-lago-maggiore', 'name' => 'Centre', 'is_reverse' => false, 'length' => 1656],
            ['location' => 'autodrome-lago-maggiore', 'name' => 'Centre - Reverse', 'is_reverse' => true, 'length' => 1656],
            ['location' => 'autodrome-lago-maggiore', 'name' => 'East End', 'is_reverse' => false, 'length' => 2033],
            ['location' => 'autodrome-lago-maggiore', 'name' => 'East End - Reverse', 'is_reverse' => true, 'length' => 2033],
            ['location' => 'autodrome-lago-maggiore', 'name' => 'West End', 'is_reverse' => false, 'length' => 2413],
            ['location' => 'autodrome-lago-maggiore', 'name' => 'West End - Reverse', 'is_reverse' => true, 'length' => 2413],
            ['location' => 'autodrome-lago-maggiore', 'name' => 'East', 'is_reverse' => false, 'length' => 3600],
            ['location' => 'autodrome-lago-maggiore', 'name' => 'East - Reverse', 'is_reverse' => true, 'length' => 3600],
            ['location' => 'autodrome-lago-maggiore', 'name' => 'West', 'is_reverse' => false, 'length' => 4168],
            ['location' => 'autodrome-lago-maggiore', 'name' => 'West - Reverse', 'is_reverse' => true, 'length' => 4168],

            // Sardegna - Road Track (Fictional)
            ['location' => 'sardegna-road-track', 'name' => 'Layout A', 'is_reverse' => false, 'length' => 5138],
            ['location' => 'sardegna-road-track', 'name' => 'Layout A - Reverse', 'is_reverse' => true, 'length' => 5138],
            ['location' => 'sardegna-road-track', 'name' => 'Layout B', 'is_reverse' => false, 'length' => 3886],
            ['location' => 'sardegna-road-track', 'name' => 'Layout B - Reverse', 'is_reverse' => true, 'length' => 3886],
            ['location' => 'sardegna-road-track', 'name' => 'Layout C', 'is_reverse' => false, 'length' => 2679],
            ['location' => 'sardegna-road-track', 'name' => 'Layout C - Reverse', 'is_reverse' => true, 'length' => 2679],

            // Sardegna - Windmills (Fictional)
            ['location' => 'sardegna-windmills', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 3293],
            ['location' => 'sardegna-windmills', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 3293],

            // Eiger Nordwand (Fictional)
            ['location' => 'eiger-nordwand', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 2436],
            ['location' => 'eiger-nordwand', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 2436],

            // Deep Forest Raceway (Fictional)
            ['location' => 'deep-forest-raceway', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 4253],
            ['location' => 'deep-forest-raceway', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 4253],

            // Dragon Trail (Fictional)
            ['location' => 'dragon-trail', 'name' => 'Seaside', 'is_reverse' => false, 'length' => 5209],
            ['location' => 'dragon-trail', 'name' => 'Seaside - Reverse', 'is_reverse' => true, 'length' => 5209],
            ['location' => 'dragon-trail', 'name' => 'Gardens', 'is_reverse' => false, 'length' => 4352],
            ['location' => 'dragon-trail', 'name' => 'Gardens - Reverse', 'is_reverse' => true, 'length' => 4352],

            // Suzuka Circuit
            ['location' => 'suzuka-circuit', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 5807],
            ['location' => 'suzuka-circuit', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 5807],
            ['location' => 'suzuka-circuit', 'name' => 'East Course', 'is_reverse' => false, 'length' => 2243],
            ['location' => 'suzuka-circuit', 'name' => 'East Course - Reverse', 'is_reverse' => true, 'length' => 2243],

            // Fuji International Speedway
            ['location' => 'fuji-international-speedway', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 4563],
            ['location' => 'fuji-international-speedway', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 4563],
            ['location' => 'fuji-international-speedway', 'name' => 'Short Course', 'is_reverse' => false, 'length' => 4526],
            ['location' => 'fuji-international-speedway', 'name' => 'Short Course - Reverse', 'is_reverse' => true, 'length' => 4526],

            // Autopolis International Racing Course
            ['location' => 'autopolis-international-racing-course', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 4674],
            ['location' => 'autopolis-international-racing-course', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 4674],
            ['location' => 'autopolis-international-racing-course', 'name' => 'Shortcut Course', 'is_reverse' => false, 'length' => 3022],
            ['location' => 'autopolis-international-racing-course', 'name' => 'Shortcut Course - Reverse', 'is_reverse' => true, 'length' => 3022],

            // Tsukuba Circuit
            ['location' => 'tsukuba-circuit', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 2045],
            ['location' => 'tsukuba-circuit', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 2045],

            // Mount Panorama Circuit (Bathurst)
            ['location' => 'mount-panorama-circuit', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 6213],
            ['location' => 'mount-panorama-circuit', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 6213],

            // Yas Marina Circuit
            ['location' => 'yas-marina-circuit', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 5281],
            ['location' => 'yas-marina-circuit', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 5281],

            // Tokyo Expressway (Fictional)
            ['location' => 'tokyo-expressway', 'name' => 'Central Clockwise', 'is_reverse' => false, 'length' => 4420],
            ['location' => 'tokyo-expressway', 'name' => 'Central Counterclockwise', 'is_reverse' => true, 'length' => 4420],
            ['location' => 'tokyo-expressway', 'name' => 'East Clockwise', 'is_reverse' => false, 'length' => 7262],
            ['location' => 'tokyo-expressway', 'name' => 'East Counterclockwise', 'is_reverse' => true, 'length' => 7196],
            ['location' => 'tokyo-expressway', 'name' => 'South Clockwise', 'is_reverse' => false, 'length' => 5200],
            ['location' => 'tokyo-expressway', 'name' => 'South Counterclockwise', 'is_reverse' => true, 'length' => 6641],

            // Kyoto Driving Park (Fictional)
            ['location' => 'kyoto-driving-park', 'name' => 'Yamagiwa', 'is_reverse' => false, 'length' => 4912],
            ['location' => 'kyoto-driving-park', 'name' => 'Yamagiwa - Reverse', 'is_reverse' => true, 'length' => 4912],
            ['location' => 'kyoto-driving-park', 'name' => 'Miyabi', 'is_reverse' => false, 'length' => 2033],
            ['location' => 'kyoto-driving-park', 'name' => 'Miyabi - Reverse', 'is_reverse' => true, 'length' => 2033],
            ['location' => 'kyoto-driving-park', 'name' => 'Yamagiwa + Miyabi', 'is_reverse' => false, 'length' => 6846],
            ['location' => 'kyoto-driving-park', 'name' => 'Yamagiwa + Miyabi - Reverse', 'is_reverse' => true, 'length' => 6846],

            // Broad Bean Raceway (Fictional)
            ['location' => 'broad-bean-raceway', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 1665],
            ['location' => 'broad-bean-raceway', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 1665],

            // High Speed Ring (Fictional)
            ['location' => 'high-speed-ring', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 4345],
            ['location' => 'high-speed-ring', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 4345],

            // WeatherTech Raceway Laguna Seca
            ['location' => 'weathertech-raceway-laguna-seca', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 3602],
            ['location' => 'weathertech-raceway-laguna-seca', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 3602],

            // Daytona International Speedway
            ['location' => 'daytona-international-speedway', 'name' => 'Road Course', 'is_reverse' => false, 'length' => 5729],
            ['location' => 'daytona-international-speedway', 'name' => 'Road Course - Reverse', 'is_reverse' => true, 'length' => 5729],
            ['location' => 'daytona-international-speedway', 'name' => 'Tri-Oval', 'is_reverse' => false, 'length' => 4023],

            // Willow Springs International Raceway
            ['location' => 'willow-springs-international-raceway', 'name' => 'Big Willow', 'is_reverse' => false, 'length' => 4023],
            ['location' => 'willow-springs-international-raceway', 'name' => 'Big Willow - Reverse', 'is_reverse' => true, 'length' => 4023],
            ['location' => 'willow-springs-international-raceway', 'name' => 'Streets of Willow Springs', 'is_reverse' => false, 'length' => 2655],
            ['location' => 'willow-springs-international-raceway', 'name' => 'Streets of Willow Springs - Reverse', 'is_reverse' => true, 'length' => 2655],
            ['location' => 'willow-springs-international-raceway', 'name' => 'Horse Thief Mile', 'is_reverse' => false, 'length' => 1609],
            ['location' => 'willow-springs-international-raceway', 'name' => 'Horse Thief Mile - Reverse', 'is_reverse' => true, 'length' => 1609],

            // Michelin Raceway Road Atlanta
            ['location' => 'michelin-raceway-road-atlanta', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 4088],
            ['location' => 'michelin-raceway-road-atlanta', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 4088],

            // Watkins Glen International
            ['location' => 'watkins-glen-international', 'name' => 'Long Course', 'is_reverse' => false, 'length' => 5430],
            ['location' => 'watkins-glen-international', 'name' => 'Long Course - Reverse', 'is_reverse' => true, 'length' => 5430],
            ['location' => 'watkins-glen-international', 'name' => 'Short Course', 'is_reverse' => false, 'length' => 3877],
            ['location' => 'watkins-glen-international', 'name' => 'Short Course - Reverse', 'is_reverse' => true, 'length' => 3877],

            // Circuit Gilles-Villeneuve
            ['location' => 'circuit-gilles-villeneuve', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 4361],
            ['location' => 'circuit-gilles-villeneuve', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 4361],

            // Blue Moon Bay Speedway (Fictional)
            ['location' => 'blue-moon-bay-speedway', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 3200],
            ['location' => 'blue-moon-bay-speedway', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 3200],
            ['location' => 'blue-moon-bay-speedway', 'name' => 'Infield A', 'is_reverse' => false, 'length' => 3350],
            ['location' => 'blue-moon-bay-speedway', 'name' => 'Infield A - Reverse', 'is_reverse' => true, 'length' => 3350],
            ['location' => 'blue-moon-bay-speedway', 'name' => 'Infield B', 'is_reverse' => false, 'length' => 2938],
            ['location' => 'blue-moon-bay-speedway', 'name' => 'Infield B - Reverse', 'is_reverse' => true, 'length' => 2938],

            // Northern Isle Speedway (Fictional)
            ['location' => 'northern-isle-speedway', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 900],

            // Grand Valley (Fictional)
            ['location' => 'grand-valley', 'name' => 'Highway 1', 'is_reverse' => false, 'length' => 5099],
            ['location' => 'grand-valley', 'name' => 'Highway 1 - Reverse', 'is_reverse' => true, 'length' => 5099],
            ['location' => 'grand-valley', 'name' => 'South', 'is_reverse' => false, 'length' => 3076],
            ['location' => 'grand-valley', 'name' => 'South - Reverse', 'is_reverse' => true, 'length' => 3076],

            // Trial Mountain Circuit (Fictional)
            ['location' => 'trial-mountain-circuit', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 5408],
            ['location' => 'trial-mountain-circuit', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 5408],

            // Special Stage Route X (Fictional)
            ['location' => 'special-stage-route-x', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 30300],

            // Colorado Springs (Fictional - Dirt)
            ['location' => 'colorado-springs', 'name' => 'Lake', 'is_reverse' => false, 'length' => 2990],
            ['location' => 'colorado-springs', 'name' => 'Lake - Reverse', 'is_reverse' => true, 'length' => 2990],

            // Fishermans Ranch (Fictional - Dirt)
            ['location' => 'fishermans-ranch', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 6893],
            ['location' => 'fishermans-ranch', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 6893],

            // Lake Louise (Fictional - Snow/Ice)
            ['location' => 'lake-louise', 'name' => 'Tri-Oval', 'is_reverse' => false, 'length' => 3068],
            ['location' => 'lake-louise', 'name' => 'Short Track', 'is_reverse' => false, 'length' => 2551],
            ['location' => 'lake-louise', 'name' => 'Long Track', 'is_reverse' => false, 'length' => 3694],

            // Autódromo de Interlagos
            ['location' => 'autodromo-de-interlagos', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 4309],
            ['location' => 'autodromo-de-interlagos', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 4309],
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

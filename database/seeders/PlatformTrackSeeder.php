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

        if (! $gt7Platform) {
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
            ['id' => 1, 'location' => 'brands-hatch', 'name' => 'Grand Prix Circuit', 'is_reverse' => false, 'length' => 3946],
            ['id' => 2, 'location' => 'brands-hatch', 'name' => 'Grand Prix Circuit - Reverse', 'is_reverse' => true, 'length' => 3946],
            ['id' => 3, 'location' => 'brands-hatch', 'name' => 'Indy Circuit', 'is_reverse' => false, 'length' => 1944],
            ['id' => 4, 'location' => 'brands-hatch', 'name' => 'Indy Circuit - Reverse', 'is_reverse' => true, 'length' => 1944],

            // Goodwood Motor Circuit
            ['id' => 5, 'location' => 'goodwood-motor-circuit', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 3809],
            ['id' => 6, 'location' => 'goodwood-motor-circuit', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 3809],

            // Spa-Francorchamps
            ['id' => 7, 'location' => 'circuit-de-spa-francorchamps', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 7044],
            ['id' => 8, 'location' => 'circuit-de-spa-francorchamps', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 7044],
            ['id' => 9, 'location' => 'circuit-de-spa-francorchamps', 'name' => '24h Layout', 'is_reverse' => false, 'length' => 7044],

            // Monza
            ['id' => 10, 'location' => 'autodromo-nazionale-monza', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 5793],
            ['id' => 11, 'location' => 'autodromo-nazionale-monza', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 5793],
            ['id' => 12, 'location' => 'autodromo-nazionale-monza', 'name' => 'No Chicane', 'is_reverse' => false, 'length' => 5755],
            ['id' => 13, 'location' => 'autodromo-nazionale-monza', 'name' => 'No Chicane - Reverse', 'is_reverse' => true, 'length' => 5755],

            // Barcelona-Catalunya
            ['id' => 14, 'location' => 'circuit-de-barcelona-catalunya', 'name' => 'Grand Prix Layout', 'is_reverse' => false, 'length' => 4655],
            ['id' => 15, 'location' => 'circuit-de-barcelona-catalunya', 'name' => 'Grand Prix Layout - Reverse', 'is_reverse' => true, 'length' => 4655],
            ['id' => 16, 'location' => 'circuit-de-barcelona-catalunya', 'name' => 'Grand Prix Layout No Chicane', 'is_reverse' => false, 'length' => 4675],
            ['id' => 17, 'location' => 'circuit-de-barcelona-catalunya', 'name' => 'National Layout', 'is_reverse' => false, 'length' => 3000],
            ['id' => 18, 'location' => 'circuit-de-barcelona-catalunya', 'name' => 'National Layout - Reverse', 'is_reverse' => true, 'length' => 3000],
            ['id' => 19, 'location' => 'circuit-de-barcelona-catalunya', 'name' => 'Rallycross Layout', 'is_reverse' => false, 'length' => 1133],

            // Nürburgring
            ['id' => 20, 'location' => 'nurburgring', 'name' => 'Nordschleife', 'is_reverse' => false, 'length' => 20832],
            ['id' => 21, 'location' => 'nurburgring', 'name' => 'Nordschleife Tourist', 'is_reverse' => false, 'length' => 20832],
            ['id' => 22, 'location' => 'nurburgring', 'name' => '24h Layout', 'is_reverse' => false, 'length' => 25378],
            ['id' => 23, 'location' => 'nurburgring', 'name' => 'Grand Prix Circuit', 'is_reverse' => false, 'length' => 5137],
            ['id' => 24, 'location' => 'nurburgring', 'name' => 'Grand Prix Circuit - Reverse', 'is_reverse' => true, 'length' => 5137],
            ['id' => 25, 'location' => 'nurburgring', 'name' => 'Sprint', 'is_reverse' => false, 'length' => 3629],
            ['id' => 26, 'location' => 'nurburgring', 'name' => 'Sprint - Reverse', 'is_reverse' => true, 'length' => 3629],
            ['id' => 27, 'location' => 'nurburgring', 'name' => 'Endurance', 'is_reverse' => false, 'length' => 23900],

            // Red Bull Ring
            ['id' => 28, 'location' => 'red-bull-ring', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 4318],
            ['id' => 29, 'location' => 'red-bull-ring', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 4318],
            ['id' => 30, 'location' => 'red-bull-ring', 'name' => 'Short Track', 'is_reverse' => false, 'length' => 2336],
            ['id' => 31, 'location' => 'red-bull-ring', 'name' => 'Short Track - Reverse', 'is_reverse' => true, 'length' => 2336],

            // 24 Heures du Mans (Circuit de la Sarthe)
            ['id' => 32, 'location' => '24-heures-du-mans-racing-circuit', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 13629],
            ['id' => 33, 'location' => '24-heures-du-mans-racing-circuit', 'name' => 'No Chicane', 'is_reverse' => false, 'length' => 13567],

            // Alsace (Fictional)
            ['id' => 34, 'location' => 'alsace', 'name' => 'Village', 'is_reverse' => false, 'length' => 5423],
            ['id' => 35, 'location' => 'alsace', 'name' => 'Village - Reverse', 'is_reverse' => true, 'length' => 5423],
            ['id' => 36, 'location' => 'alsace', 'name' => 'Test Course', 'is_reverse' => false, 'length' => 2118],

            // Circuit de Sainte-Croix (Fictional)
            ['id' => 37, 'location' => 'circuit-de-sainte-croix', 'name' => 'Layout A', 'is_reverse' => false, 'length' => 9477],
            ['id' => 38, 'location' => 'circuit-de-sainte-croix', 'name' => 'Layout A - Reverse', 'is_reverse' => true, 'length' => 9477],
            ['id' => 39, 'location' => 'circuit-de-sainte-croix', 'name' => 'Layout B', 'is_reverse' => false, 'length' => 7107],
            ['id' => 40, 'location' => 'circuit-de-sainte-croix', 'name' => 'Layout B - Reverse', 'is_reverse' => true, 'length' => 7107],
            ['id' => 41, 'location' => 'circuit-de-sainte-croix', 'name' => 'Layout C', 'is_reverse' => false, 'length' => 10825],
            ['id' => 42, 'location' => 'circuit-de-sainte-croix', 'name' => 'Layout C - Reverse', 'is_reverse' => true, 'length' => 10825],

            // Autodrome Lago Maggiore (Fictional)
            ['id' => 43, 'location' => 'autodrome-lago-maggiore', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 5809],
            ['id' => 44, 'location' => 'autodrome-lago-maggiore', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 5809],
            ['id' => 45, 'location' => 'autodrome-lago-maggiore', 'name' => 'Centre', 'is_reverse' => false, 'length' => 1656],
            ['id' => 46, 'location' => 'autodrome-lago-maggiore', 'name' => 'Centre - Reverse', 'is_reverse' => true, 'length' => 1656],
            ['id' => 47, 'location' => 'autodrome-lago-maggiore', 'name' => 'East End', 'is_reverse' => false, 'length' => 2033],
            ['id' => 48, 'location' => 'autodrome-lago-maggiore', 'name' => 'East End - Reverse', 'is_reverse' => true, 'length' => 2033],
            ['id' => 49, 'location' => 'autodrome-lago-maggiore', 'name' => 'West End', 'is_reverse' => false, 'length' => 2413],
            ['id' => 50, 'location' => 'autodrome-lago-maggiore', 'name' => 'West End - Reverse', 'is_reverse' => true, 'length' => 2413],
            ['id' => 51, 'location' => 'autodrome-lago-maggiore', 'name' => 'East', 'is_reverse' => false, 'length' => 3600],
            ['id' => 52, 'location' => 'autodrome-lago-maggiore', 'name' => 'East - Reverse', 'is_reverse' => true, 'length' => 3600],
            ['id' => 53, 'location' => 'autodrome-lago-maggiore', 'name' => 'West', 'is_reverse' => false, 'length' => 4168],
            ['id' => 54, 'location' => 'autodrome-lago-maggiore', 'name' => 'West - Reverse', 'is_reverse' => true, 'length' => 4168],

            // Sardegna - Road Track (Fictional)
            ['id' => 55, 'location' => 'sardegna-road-track', 'name' => 'Layout A', 'is_reverse' => false, 'length' => 5138],
            ['id' => 56, 'location' => 'sardegna-road-track', 'name' => 'Layout A - Reverse', 'is_reverse' => true, 'length' => 5138],
            ['id' => 57, 'location' => 'sardegna-road-track', 'name' => 'Layout B', 'is_reverse' => false, 'length' => 3886],
            ['id' => 58, 'location' => 'sardegna-road-track', 'name' => 'Layout B - Reverse', 'is_reverse' => true, 'length' => 3886],
            ['id' => 59, 'location' => 'sardegna-road-track', 'name' => 'Layout C', 'is_reverse' => false, 'length' => 2679],
            ['id' => 60, 'location' => 'sardegna-road-track', 'name' => 'Layout C - Reverse', 'is_reverse' => true, 'length' => 2679],

            // Sardegna - Windmills (Fictional)
            ['id' => 61, 'location' => 'sardegna-windmills', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 3293],
            ['id' => 62, 'location' => 'sardegna-windmills', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 3293],

            // Eiger Nordwand (Fictional)
            ['id' => 63, 'location' => 'eiger-nordwand', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 2436],
            ['id' => 64, 'location' => 'eiger-nordwand', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 2436],

            // Deep Forest Raceway (Fictional)
            ['id' => 65, 'location' => 'deep-forest-raceway', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 4253],
            ['id' => 66, 'location' => 'deep-forest-raceway', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 4253],

            // Dragon Trail (Fictional)
            ['id' => 67, 'location' => 'dragon-trail', 'name' => 'Seaside', 'is_reverse' => false, 'length' => 5209],
            ['id' => 68, 'location' => 'dragon-trail', 'name' => 'Seaside - Reverse', 'is_reverse' => true, 'length' => 5209],
            ['id' => 69, 'location' => 'dragon-trail', 'name' => 'Gardens', 'is_reverse' => false, 'length' => 4352],
            ['id' => 70, 'location' => 'dragon-trail', 'name' => 'Gardens - Reverse', 'is_reverse' => true, 'length' => 4352],

            // Suzuka Circuit
            ['id' => 71, 'location' => 'suzuka-circuit', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 5807],
            ['id' => 72, 'location' => 'suzuka-circuit', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 5807],
            ['id' => 73, 'location' => 'suzuka-circuit', 'name' => 'East Course', 'is_reverse' => false, 'length' => 2243],
            ['id' => 74, 'location' => 'suzuka-circuit', 'name' => 'East Course - Reverse', 'is_reverse' => true, 'length' => 2243],

            // Fuji International Speedway
            ['id' => 75, 'location' => 'fuji-international-speedway', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 4563],
            ['id' => 76, 'location' => 'fuji-international-speedway', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 4563],
            ['id' => 77, 'location' => 'fuji-international-speedway', 'name' => 'Short Course', 'is_reverse' => false, 'length' => 4526],
            ['id' => 78, 'location' => 'fuji-international-speedway', 'name' => 'Short Course - Reverse', 'is_reverse' => true, 'length' => 4526],

            // Autopolis International Racing Course
            ['id' => 79, 'location' => 'autopolis-international-racing-course', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 4674],
            ['id' => 80, 'location' => 'autopolis-international-racing-course', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 4674],
            ['id' => 81, 'location' => 'autopolis-international-racing-course', 'name' => 'Shortcut Course', 'is_reverse' => false, 'length' => 3022],
            ['id' => 82, 'location' => 'autopolis-international-racing-course', 'name' => 'Shortcut Course - Reverse', 'is_reverse' => true, 'length' => 3022],

            // Tsukuba Circuit
            ['id' => 83, 'location' => 'tsukuba-circuit', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 2045],
            ['id' => 84, 'location' => 'tsukuba-circuit', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 2045],

            // Mount Panorama Circuit (Bathurst)
            ['id' => 85, 'location' => 'mount-panorama-circuit', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 6213],
            ['id' => 86, 'location' => 'mount-panorama-circuit', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 6213],

            // Yas Marina Circuit
            ['id' => 87, 'location' => 'yas-marina-circuit', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 5281],
            ['id' => 88, 'location' => 'yas-marina-circuit', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 5281],

            // Tokyo Expressway (Fictional)
            ['id' => 89, 'location' => 'tokyo-expressway', 'name' => 'Central Clockwise', 'is_reverse' => false, 'length' => 4420],
            ['id' => 90, 'location' => 'tokyo-expressway', 'name' => 'Central Counterclockwise', 'is_reverse' => true, 'length' => 4420],
            ['id' => 91, 'location' => 'tokyo-expressway', 'name' => 'East Clockwise', 'is_reverse' => false, 'length' => 7262],
            ['id' => 92, 'location' => 'tokyo-expressway', 'name' => 'East Counterclockwise', 'is_reverse' => true, 'length' => 7196],
            ['id' => 93, 'location' => 'tokyo-expressway', 'name' => 'South Clockwise', 'is_reverse' => false, 'length' => 5200],
            ['id' => 94, 'location' => 'tokyo-expressway', 'name' => 'South Counterclockwise', 'is_reverse' => true, 'length' => 6641],

            // Kyoto Driving Park (Fictional)
            ['id' => 95, 'location' => 'kyoto-driving-park', 'name' => 'Yamagiwa', 'is_reverse' => false, 'length' => 4912],
            ['id' => 96, 'location' => 'kyoto-driving-park', 'name' => 'Yamagiwa - Reverse', 'is_reverse' => true, 'length' => 4912],
            ['id' => 97, 'location' => 'kyoto-driving-park', 'name' => 'Miyabi', 'is_reverse' => false, 'length' => 2033],
            ['id' => 98, 'location' => 'kyoto-driving-park', 'name' => 'Miyabi - Reverse', 'is_reverse' => true, 'length' => 2033],
            ['id' => 99, 'location' => 'kyoto-driving-park', 'name' => 'Yamagiwa + Miyabi', 'is_reverse' => false, 'length' => 6846],
            ['id' => 100, 'location' => 'kyoto-driving-park', 'name' => 'Yamagiwa + Miyabi - Reverse', 'is_reverse' => true, 'length' => 6846],

            // Broad Bean Raceway (Fictional)
            ['id' => 101, 'location' => 'broad-bean-raceway', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 1665],
            ['id' => 102, 'location' => 'broad-bean-raceway', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 1665],

            // High Speed Ring (Fictional)
            ['id' => 103, 'location' => 'high-speed-ring', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 4345],
            ['id' => 104, 'location' => 'high-speed-ring', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 4345],

            // WeatherTech Raceway Laguna Seca
            ['id' => 105, 'location' => 'weathertech-raceway-laguna-seca', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 3602],
            ['id' => 106, 'location' => 'weathertech-raceway-laguna-seca', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 3602],

            // Daytona International Speedway
            ['id' => 107, 'location' => 'daytona-international-speedway', 'name' => 'Road Course', 'is_reverse' => false, 'length' => 5729],
            ['id' => 108, 'location' => 'daytona-international-speedway', 'name' => 'Road Course - Reverse', 'is_reverse' => true, 'length' => 5729],
            ['id' => 109, 'location' => 'daytona-international-speedway', 'name' => 'Tri-Oval', 'is_reverse' => false, 'length' => 4023],

            // Willow Springs International Raceway
            ['id' => 110, 'location' => 'willow-springs-international-raceway', 'name' => 'Big Willow', 'is_reverse' => false, 'length' => 4023],
            ['id' => 111, 'location' => 'willow-springs-international-raceway', 'name' => 'Big Willow - Reverse', 'is_reverse' => true, 'length' => 4023],
            ['id' => 112, 'location' => 'willow-springs-international-raceway', 'name' => 'Streets of Willow Springs', 'is_reverse' => false, 'length' => 2655],
            ['id' => 113, 'location' => 'willow-springs-international-raceway', 'name' => 'Streets of Willow Springs - Reverse', 'is_reverse' => true, 'length' => 2655],
            ['id' => 114, 'location' => 'willow-springs-international-raceway', 'name' => 'Horse Thief Mile', 'is_reverse' => false, 'length' => 1609],
            ['id' => 115, 'location' => 'willow-springs-international-raceway', 'name' => 'Horse Thief Mile - Reverse', 'is_reverse' => true, 'length' => 1609],

            // Michelin Raceway Road Atlanta
            ['id' => 116, 'location' => 'michelin-raceway-road-atlanta', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 4088],
            ['id' => 117, 'location' => 'michelin-raceway-road-atlanta', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 4088],

            // Watkins Glen International
            ['id' => 118, 'location' => 'watkins-glen-international', 'name' => 'Long Course', 'is_reverse' => false, 'length' => 5430],
            ['id' => 119, 'location' => 'watkins-glen-international', 'name' => 'Long Course - Reverse', 'is_reverse' => true, 'length' => 5430],
            ['id' => 120, 'location' => 'watkins-glen-international', 'name' => 'Short Course', 'is_reverse' => false, 'length' => 3877],
            ['id' => 121, 'location' => 'watkins-glen-international', 'name' => 'Short Course - Reverse', 'is_reverse' => true, 'length' => 3877],

            // Circuit Gilles-Villeneuve
            ['id' => 122, 'location' => 'circuit-gilles-villeneuve', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 4361],
            ['id' => 123, 'location' => 'circuit-gilles-villeneuve', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 4361],

            // Blue Moon Bay Speedway (Fictional)
            ['id' => 124, 'location' => 'blue-moon-bay-speedway', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 3200],
            ['id' => 125, 'location' => 'blue-moon-bay-speedway', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 3200],
            ['id' => 126, 'location' => 'blue-moon-bay-speedway', 'name' => 'Infield A', 'is_reverse' => false, 'length' => 3350],
            ['id' => 127, 'location' => 'blue-moon-bay-speedway', 'name' => 'Infield A - Reverse', 'is_reverse' => true, 'length' => 3350],
            ['id' => 128, 'location' => 'blue-moon-bay-speedway', 'name' => 'Infield B', 'is_reverse' => false, 'length' => 2938],
            ['id' => 129, 'location' => 'blue-moon-bay-speedway', 'name' => 'Infield B - Reverse', 'is_reverse' => true, 'length' => 2938],

            // Northern Isle Speedway (Fictional)
            ['id' => 130, 'location' => 'northern-isle-speedway', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 900],

            // Grand Valley (Fictional)
            ['id' => 131, 'location' => 'grand-valley', 'name' => 'Highway 1', 'is_reverse' => false, 'length' => 5099],
            ['id' => 132, 'location' => 'grand-valley', 'name' => 'Highway 1 - Reverse', 'is_reverse' => true, 'length' => 5099],
            ['id' => 133, 'location' => 'grand-valley', 'name' => 'South', 'is_reverse' => false, 'length' => 3076],
            ['id' => 134, 'location' => 'grand-valley', 'name' => 'South - Reverse', 'is_reverse' => true, 'length' => 3076],

            // Trial Mountain Circuit (Fictional)
            ['id' => 135, 'location' => 'trial-mountain-circuit', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 5408],
            ['id' => 136, 'location' => 'trial-mountain-circuit', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 5408],

            // Special Stage Route X (Fictional)
            ['id' => 137, 'location' => 'special-stage-route-x', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 30300],

            // Colorado Springs (Fictional - Dirt)
            ['id' => 138, 'location' => 'colorado-springs', 'name' => 'Lake', 'is_reverse' => false, 'length' => 2990],
            ['id' => 139, 'location' => 'colorado-springs', 'name' => 'Lake - Reverse', 'is_reverse' => true, 'length' => 2990],

            // Fishermans Ranch (Fictional - Dirt)
            ['id' => 140, 'location' => 'fishermans-ranch', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 6893],
            ['id' => 141, 'location' => 'fishermans-ranch', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 6893],

            // Lake Louise (Fictional - Snow/Ice)
            ['id' => 142, 'location' => 'lake-louise', 'name' => 'Tri-Oval', 'is_reverse' => false, 'length' => 3068],
            ['id' => 143, 'location' => 'lake-louise', 'name' => 'Short Track', 'is_reverse' => false, 'length' => 2551],
            ['id' => 144, 'location' => 'lake-louise', 'name' => 'Long Track', 'is_reverse' => false, 'length' => 3694],

            // Autódromo de Interlagos
            ['id' => 145, 'location' => 'autodromo-de-interlagos', 'name' => 'Full Course', 'is_reverse' => false, 'length' => 4309],
            ['id' => 146, 'location' => 'autodromo-de-interlagos', 'name' => 'Full Course - Reverse', 'is_reverse' => true, 'length' => 4309],
        ];

        foreach ($tracks as $track) {
            $locationId = $getLocationId($track['location']);

            if (! $locationId) {
                $this->command->warn("Location '{$track['location']}' not found, skipping track '{$track['name']}'");

                continue;
            }

            DB::table('platform_tracks')->insert([
                'id' => $track['id'],
                'platform_id' => $platformId,
                'platform_track_location_id' => $locationId,
                'name' => $track['name'],
                'slug' => Str::slug($track['name']),
                'is_reverse' => $track['is_reverse'],
                'length_meters' => $track['length'],
                'is_active' => true,
                'sort_order' => $track['id'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('Seeded ' . count($tracks) . ' Gran Turismo 7 tracks successfully!');
    }
}

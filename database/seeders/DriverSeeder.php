<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Infrastructure\Persistence\Eloquent\Models\Driver;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DriverSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('drivers')->truncate();
        DB::table('league_drivers')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Get the default league
        $league = League::where('slug', 'virtual-racing-league')->first();

        if (!$league) {
            $this->command->error('League not found. Please run LeagueSeeder first.');
            return;
        }

        $drivers = [
            ['discord_id' => 'Half-Byte', 'psn_id' => 'Half-Byte', 'race_number' => '21'],
            ['discord_id' => 'T F Eccles', 'psn_id' => 'tfeccles', 'race_number' => '52'],
            ['discord_id' => 'Vert Wheeler', 'psn_id' => 'Vertwheeler07', 'race_number' => '7'],
            ['discord_id' => 'AUSnicko9', 'psn_id' => 'AUSnicko9', 'race_number' => '91'],
            ['discord_id' => 'Beats', 'psn_id' => 'Beats143', 'race_number' => '62'],
            ['discord_id' => 'Matt Dernedde', 'psn_id' => 'ohdennn', 'race_number' => '50'],
            ['discord_id' => 'Alexb8891', 'psn_id' => 'Xtendedwarranty', 'race_number' => '11'],
            ['discord_id' => 'Kiwi_kart_racer9', 'psn_id' => 'kiwi_kart_racer9', 'race_number' => '98'],
            ['discord_id' => 'E. Presley', 'psn_id' => 'e_presley101', 'race_number' => '99'],
            ['discord_id' => 'Selraf', 'psn_id' => 'Selraf', 'race_number' => '65'],
            ['discord_id' => 'rae1982', 'psn_id' => 'Rae1982', 'race_number' => '290'],
            ['discord_id' => 'LOW_NZ', 'psn_id' => 'LOW_NZ', 'race_number' => '22'],
            ['discord_id' => 'Savage Duck', 'psn_id' => 'Savageduck_75', 'race_number' => '67'],
            ['discord_id' => 'Muzzie_013', 'psn_id' => 'Muzzie_013', 'race_number' => '13'],
            ['discord_id' => 'Kieran-B33', 'psn_id' => 'TacticalHomework', 'race_number' => '76'],
            ['discord_id' => 'Rangeraus', 'psn_id' => 'Rangeraus', 'race_number' => '82'],
            ['discord_id' => 'RBRHoges97', 'psn_id' => 'RBRHoges97', 'race_number' => '97'],
            ['discord_id' => 'Charlie chops', 'psn_id' => 'mr_charlie_chops', 'race_number' => '34'],
            ['discord_id' => 'dani249', 'psn_id' => 'Walmar_anolso', 'race_number' => '12'],
            ['discord_id' => 'Easyprey007', 'psn_id' => 'Easyprey007', 'race_number' => '63'],
            ['discord_id' => 'Wolfy 1961', 'psn_id' => 'Wolfy_1961', 'race_number' => '16'],
            ['discord_id' => 'Bob Massie', 'psn_id' => 'RPeeM808', 'race_number' => '808'],
            ['discord_id' => 'BritzLightning55', 'psn_id' => 'BritzLightning55', 'race_number' => '55'],
            ['discord_id' => 'Sylveon with a gun', 'psn_id' => 'Gregzilla1971', 'race_number' => '135'],
            ['discord_id' => 'warrior2167', 'psn_id' => 'warrior2167', 'race_number' => '25'],
            ['discord_id' => 'Valymr_Blaize', 'psn_id' => 'Valymr_Blaize', 'race_number' => '212'],
            ['discord_id' => 'UrsineSaturn9', 'psn_id' => 'UrsineSaturn9', 'race_number' => '42'],
            ['discord_id' => 'Bluntman75', 'psn_id' => 'Blunty075', 'race_number' => '75'],
            ['discord_id' => 'pokeeetus', 'psn_id' => 'TanqR7286', 'race_number' => '44'],
            ['discord_id' => 'Snorxal', 'psn_id' => 'S2T_Snorxal', 'race_number' => '39'],
            ['discord_id' => 'evilmoon', 'psn_id' => 'X-Evi1m00n', 'race_number' => '88'],
            ['discord_id' => 'Stinky', 'psn_id' => 'StinkyTaylor', 'race_number' => '66'],
            ['discord_id' => 'troll555', 'psn_id' => 'tolley__', 'race_number' => '28'],
            ['discord_id' => 'Donsflyup', 'psn_id' => 'wait6moreseconds', 'race_number' => '93'],
            ['discord_id' => 'Whizz94', 'psn_id' => 'Whizz94', 'race_number' => '26'],
            ['discord_id' => 'Schumojo13', 'psn_id' => 'Schumojo13', 'race_number' => '77'],
            ['discord_id' => 'slarty', 'psn_id' => 'slartybar', 'race_number' => '101'],
            ['discord_id' => 'fezza21', 'psn_id' => 'FeZZa_21', 'race_number' => '21'],
            ['discord_id' => 'anders_race', 'psn_id' => 'anders_race', 'race_number' => '90'],
            ['discord_id' => 'Steve_73_GOOF', 'psn_id' => 'Steve_73_GOOF', 'race_number' => '73'],
            ['discord_id' => 'Dstinct_Andrew', 'psn_id' => 'Dstinct_Andrew', 'race_number' => '1'],
            ['discord_id' => 'lpalmonds', 'psn_id' => 'lpalmonds', 'race_number' => null],
            ['discord_id' => 'T-GT Racing', 'psn_id' => 'T-GT_Racing', 'race_number' => '44'],
            ['discord_id' => 'Doodah27', 'psn_id' => 'Doodah27', 'race_number' => null],
            ['discord_id' => 'Dash_Vanguard', 'psn_id' => 'Dash_Vanguard', 'race_number' => '383'],
            ['discord_id' => 'seowster', 'psn_id' => 'seowsterAUS', 'race_number' => '27'],
            ['discord_id' => 'Emmo', 'psn_id' => 'emmo46', 'race_number' => '5'],
            ['discord_id' => 'Natalie WA', 'psn_id' => 'Natalie_275', 'race_number' => '275'],
            ['discord_id' => 'Luppo', 'psn_id' => 'social-shocker5', 'race_number' => '14'],
            ['discord_id' => 'Ozglenn', 'psn_id' => 'ozglenn0513', 'race_number' => '13'],
            ['discord_id' => 'btwong10', 'psn_id' => 'btwong10', 'race_number' => '10'],
            ['discord_id' => 'isaacfog01', 'psn_id' => 'fogdog01', 'race_number' => '99'],
            ['discord_id' => 'ITZ_JZH17', 'psn_id' => 'ITZ_JOSH15', 'race_number' => '77'],
            ['discord_id' => null, 'psn_id' => 'Viperzed', 'race_number' => null],
            ['discord_id' => null, 'psn_id' => 'JimothyPayload', 'race_number' => null],
            ['discord_id' => null, 'psn_id' => 'CaptainRisky21', 'race_number' => null],
            ['discord_id' => null, 'psn_id' => 'MINT_Matt', 'race_number' => null],
            ['discord_id' => null, 'psn_id' => 'BlockyRex1', 'race_number' => null],
            ['discord_id' => null, 'psn_id' => 'sidawg2', 'race_number' => null],
            ['discord_id' => null, 'psn_id' => 'johnnoclint', 'race_number' => null],
            ['discord_id' => null, 'psn_id' => 'Selduin', 'race_number' => null],
            ['discord_id' => null, 'psn_id' => 'K. Brown', 'race_number' => null],
            ['discord_id' => null, 'psn_id' => 'B. CakePie', 'race_number' => null],
            ['discord_id' => null, 'psn_id' => 'DRZ-Hatfield', 'race_number' => null],
            ['discord_id' => null, 'psn_id' => 'arbee5555', 'race_number' => null],
            ['discord_id' => null, 'psn_id' => 'TimAnt_46', 'race_number' => null],
            ['discord_id' => null, 'psn_id' => 'arnoldwa', 'race_number' => null],
            ['discord_id' => null, 'psn_id' => 'LuckyDenverM1nt', 'race_number' => null],
        ];

        foreach ($drivers as $driverData) {
            // Generate a unique slug from PSN ID
            $baseSlug = Str::slug($driverData['psn_id']);
            $slug = $baseSlug;
            $counter = 1;

            // Ensure slug uniqueness
            while (Driver::where('slug', $slug)->exists()) {
                $slug = $baseSlug . '-' . $counter;
                $counter++;
            }

            // Create the driver
            $driver = Driver::create([
                'nickname' => $driverData['discord_id'],
                'slug' => $slug,
                'psn_id' => $driverData['psn_id'],
                'discord_id' => $driverData['discord_id'],
            ]);

            // Add driver to the league
            LeagueDriverEloquent::create([
                'league_id' => $league->id,
                'driver_id' => $driver->id,
                'driver_number' => $driverData['race_number'] ? (int) $driverData['race_number'] : null,
                'status' => 'active',
                'added_to_league_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}

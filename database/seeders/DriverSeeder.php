<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Infrastructure\Persistence\Eloquent\Models\Driver;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

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
            ['nickname' => 'Half-Byte', 'slug' => 'half-byte', 'psn_id' => 'Half-Byte', 'discord_id' => 'Half-Byte', 'race_number' => 21],
            ['nickname' => 'T F Eccles', 'slug' => 'tfeccles', 'psn_id' => 'tfeccles', 'discord_id' => 'T F Eccles', 'race_number' => 52],
            ['nickname' => 'Vert Wheeler', 'slug' => 'vertwheeler07', 'psn_id' => 'Vertwheeler07', 'discord_id' => 'Vert Wheeler', 'race_number' => 7],
            ['nickname' => 'AUSnicko9', 'slug' => 'ausnicko9', 'psn_id' => 'AUSnicko9', 'discord_id' => 'AUSnicko9', 'race_number' => 91],
            ['nickname' => 'Beats', 'slug' => 'beats143', 'psn_id' => 'Beats143', 'discord_id' => 'Beats', 'race_number' => 62],
            ['nickname' => 'Matt Dernedde', 'slug' => 'ohdennn', 'psn_id' => 'ohdennn', 'discord_id' => 'Matt Dernedde', 'race_number' => 50],
            ['nickname' => 'Alexb8891', 'slug' => 'xtendedwarranty', 'psn_id' => 'Xtendedwarranty', 'discord_id' => 'Alexb8891', 'race_number' => 11],
            ['nickname' => 'Kiwi_kart_racer9', 'slug' => 'kiwi-kart-racer9', 'psn_id' => 'kiwi_kart_racer9', 'discord_id' => 'Kiwi_kart_racer9', 'race_number' => 98],
            ['nickname' => 'E. Presley', 'slug' => 'e-presley101', 'psn_id' => 'e_presley101', 'discord_id' => 'E. Presley', 'race_number' => 63],
            ['nickname' => 'j. Farley', 'slug' => 'j-farley', 'psn_id' => 'Selraf', 'discord_id' => 'Selraf', 'race_number' => 65],
            ['nickname' => 'rae1982', 'slug' => 'rae1982', 'psn_id' => 'Rae1982', 'discord_id' => 'rae1982', 'race_number' => 290],
            ['nickname' => 'J.Nightingale', 'slug' => 'jnightingale', 'psn_id' => 'LOW_NZ', 'discord_id' => 'LOW_NZ', 'race_number' => 22],
            ['nickname' => 'Savage_Duck_75', 'slug' => 'savage-duck-75', 'psn_id' => 'Savageduck_75', 'discord_id' => 'Savage Duck', 'race_number' => 67],
            ['nickname' => 'Muzzie_013', 'slug' => 'muzzie-013', 'psn_id' => 'Muzzie_013', 'discord_id' => 'Muzzie_013', 'race_number' => 13],
            ['nickname' => 'K. Brown', 'slug' => 'tacticalhomework', 'psn_id' => 'TacticalHomework', 'discord_id' => 'Kieran-B33', 'race_number' => 76],
            ['nickname' => 'Rangeraus', 'slug' => 'rangeraus', 'psn_id' => 'Rangeraus', 'discord_id' => 'Rangeraus', 'race_number' => 82],
            ['nickname' => 'RBRHoges97', 'slug' => 'rbrhoges97', 'psn_id' => 'RBRHoges97', 'discord_id' => 'RBRHoges97', 'race_number' => 97],
            ['nickname' => 'Charlie chops', 'slug' => 'mr-charlie-chops', 'psn_id' => 'mr_charlie_chops', 'discord_id' => 'Charlie chops', 'race_number' => 34],
            ['nickname' => 'dani249', 'slug' => 'walmar-anolso', 'psn_id' => 'Walmar_anolso', 'discord_id' => 'dani249', 'race_number' => 12],
            ['nickname' => 'Easyprey007', 'slug' => 'easyprey007', 'psn_id' => 'Easyprey007', 'discord_id' => 'Easyprey007', 'race_number' => 63],
            ['nickname' => 'Wolfy 1961', 'slug' => 'wolfy-1961', 'psn_id' => 'Wolfy_1961', 'discord_id' => 'Wolfy 1961', 'race_number' => 16],
            ['nickname' => 'Bob Massie', 'slug' => 'rpeem808', 'psn_id' => 'RPeeM808', 'discord_id' => 'Bob Massie', 'race_number' => 809],
            ['nickname' => 'BritzLightning55', 'slug' => 'britzlightning55', 'psn_id' => 'BritzLightning55', 'discord_id' => 'BritzLightning55', 'race_number' => 55],
            ['nickname' => 'Sylveon with a gun', 'slug' => 'gregzilla1971', 'psn_id' => 'Gregzilla1971', 'discord_id' => 'Sylveon with a gun', 'race_number' => 135],
            ['nickname' => 'warrior2167', 'slug' => 'warrior2167', 'psn_id' => 'warrior2167', 'discord_id' => 'warrior2167', 'race_number' => 25],
            ['nickname' => 'JC_Blaize', 'slug' => 'jc-blaize', 'psn_id' => 'Valymr_Blaize', 'discord_id' => 'Valymr_Blaize', 'race_number' => 212],
            ['nickname' => 'UrsineSaturn9', 'slug' => 'ursinesaturn9', 'psn_id' => 'UrsineSaturn9', 'discord_id' => 'UrsineSaturn9', 'race_number' => 42],
            ['nickname' => 'Bluntman75', 'slug' => 'blunty075', 'psn_id' => 'Blunty075', 'discord_id' => 'Bluntman75', 'race_number' => 75],
            ['nickname' => 'pokeeetus', 'slug' => 'pokeeetus', 'psn_id' => 'TanqR7286', 'discord_id' => 'pokeeetus', 'race_number' => 44],
            ['nickname' => 'Snorxal', 'slug' => 's2t-snorxal', 'psn_id' => 'S2T_Snorxal', 'discord_id' => 'Snorxal', 'race_number' => 39],
            ['nickname' => 'X-3vi1 m00n', 'slug' => 'x-3vi1-m00n', 'psn_id' => 'X-Evi1m00n', 'discord_id' => 'evilmoon', 'race_number' => 88],
            ['nickname' => 'Stinky', 'slug' => 'stinkytaylor', 'psn_id' => 'StinkyTaylor', 'discord_id' => 'Stinky', 'race_number' => 66],
            ['nickname' => 'tolley_', 'slug' => 'tolley', 'psn_id' => 'tolley__', 'discord_id' => 'troll555', 'race_number' => 28],
            ['nickname' => 'Donsflyup', 'slug' => 'wait6moreseconds', 'psn_id' => 'wait6moreseconds', 'discord_id' => 'Donsflyup', 'race_number' => 93],
            ['nickname' => 'Whizz94', 'slug' => 'whizz94', 'psn_id' => 'Whizz94', 'discord_id' => 'Whizz94', 'race_number' => 26],
            ['nickname' => 'Schumojo 13', 'slug' => 'schumojo-13', 'psn_id' => 'Schumojo13', 'discord_id' => 'Schumojo13', 'race_number' => 77],
            ['nickname' => 'slarty', 'slug' => 'slartybar', 'psn_id' => 'slartybar', 'discord_id' => 'slarty', 'race_number' => 101],
            ['nickname' => 'fezza21', 'slug' => 'fezza-21', 'psn_id' => 'FeZZa_21', 'discord_id' => 'fezza21', 'race_number' => 21],
            ['nickname' => 'anders_race', 'slug' => 'anders-race', 'psn_id' => 'anders_race', 'discord_id' => 'anders_race', 'race_number' => 90],
            ['nickname' => 'Steve_73_GOOF', 'slug' => 'steve-73-goof', 'psn_id' => 'Steve_73_GOOF', 'discord_id' => 'Steve_73_GOOF', 'race_number' => 73],
            ['nickname' => 'Dstinct_Andrew', 'slug' => 'dstinct-andrew', 'psn_id' => 'Dstinct_Andrew', 'discord_id' => 'Dstinct_Andrew', 'race_number' => 1],
            ['nickname' => 'lpalmonds', 'slug' => 'lpalmonds', 'psn_id' => 'lpalmonds', 'discord_id' => 'lpalmonds', 'race_number' => null],
            ['nickname' => 'T-GT Racing', 'slug' => 't-gt-racing', 'psn_id' => 'T-GT_Racing', 'discord_id' => 'T-GT Racing', 'race_number' => 44],
            ['nickname' => 'Doodah27', 'slug' => 'doodah27', 'psn_id' => 'Doodah27', 'discord_id' => 'Doodah27', 'race_number' => null],
            ['nickname' => 'Dash_Vanguard', 'slug' => 'dash-vanguard', 'psn_id' => 'Dash_Vanguard', 'discord_id' => 'Dash_Vanguard', 'race_number' => 383],
            ['nickname' => 'seowster', 'slug' => 'seowsteraus', 'psn_id' => 'seowsterAUS', 'discord_id' => 'seowster', 'race_number' => 27],
            ['nickname' => 'Emmo', 'slug' => 'emmo46', 'psn_id' => 'emmo46', 'discord_id' => 'Emmo', 'race_number' => 5],
            ['nickname' => 'Natalie WA', 'slug' => 'natalie-275', 'psn_id' => 'Natalie_275', 'discord_id' => 'Natalie WA', 'race_number' => 275],
            ['nickname' => 'Luppo', 'slug' => 'social-shocker5', 'psn_id' => 'social-shocker5', 'discord_id' => 'Luppo', 'race_number' => 14],
            ['nickname' => 'Ozglenn', 'slug' => 'ozglenn0513', 'psn_id' => 'ozglenn0513', 'discord_id' => 'Ozglenn', 'race_number' => 13],
            ['nickname' => 'btwong', 'slug' => 'btwong', 'psn_id' => 'btwong10', 'discord_id' => 'btwong10', 'race_number' => 10],
            ['nickname' => 'isaacfog01', 'slug' => 'fogdog01', 'psn_id' => 'fogdog01', 'discord_id' => 'isaacfog01', 'race_number' => 99],
            ['nickname' => 'ITZ_JZH17', 'slug' => 'itz-josh15', 'psn_id' => 'ITZ_JOSH15', 'discord_id' => 'ITZ_JZH17', 'race_number' => 77],
            ['nickname' => 'Viperzed', 'slug' => 'viperzed', 'psn_id' => 'Viperzed', 'discord_id' => null, 'race_number' => null],
            ['nickname' => 'JimothyPayload', 'slug' => 'jimothypayload', 'psn_id' => 'JimothyPayload', 'discord_id' => 'Jimothy Payload', 'race_number' => 123],
            ['nickname' => 'CaptainRisky21', 'slug' => 'captainrisky21', 'psn_id' => 'CaptainRisky21', 'discord_id' => null, 'race_number' => null],
            ['nickname' => 'MINT_Matt', 'slug' => 'mint-matt', 'psn_id' => 'MINT_Matt', 'discord_id' => 'Matt Simmons', 'race_number' => 8],
            ['nickname' => 'BlockyRex1', 'slug' => 'blockyrex1', 'psn_id' => 'BlockyRex1', 'discord_id' => null, 'race_number' => null],
            ['nickname' => 'sidawg2', 'slug' => 'sidawg2', 'psn_id' => 'sidawg2', 'discord_id' => null, 'race_number' => null],
            ['nickname' => 'Matthyus', 'slug' => 'johnnoclint', 'psn_id' => 'johnnoclint', 'discord_id' => 'Matthyus', 'race_number' => 95],
            ['nickname' => 'Selduin', 'slug' => 'selduin', 'psn_id' => 'Selduin', 'discord_id' => 'Selduin', 'race_number' => 81],
            ['nickname' => 'B. CakePie', 'slug' => 'b-cakepie', 'psn_id' => 'B. CakePie', 'discord_id' => null, 'race_number' => null],
            ['nickname' => 'DRZ-Hatfield', 'slug' => 'drz-hatfield', 'psn_id' => 'DRZ-Hatfield', 'discord_id' => 'DRZ-Hatfield', 'race_number' => 3],
            ['nickname' => 'Jelly Mechanic', 'slug' => 'jelly-mechanic', 'psn_id' => 'arbee5555', 'discord_id' => null, 'race_number' => null],
            ['nickname' => 'TimAnt_46', 'slug' => 'timant-46', 'psn_id' => 'TimAnt_46', 'discord_id' => 'TimAnt46', 'race_number' => 22],
            ['nickname' => 'arnoldwa', 'slug' => 'arnoldwa', 'psn_id' => 'arnoldwa', 'discord_id' => 'arnold', 'race_number' => null],
            ['nickname' => 'AverageDad', 'slug' => 'averagedad', 'psn_id' => 'LuckyDenverM1nt', 'discord_id' => 'AverageDAD', 'race_number' => 33],
            ['nickname' => 'Hatchy3_', 'slug' => 'hatchy3', 'psn_id' => 'Hatchy3_', 'discord_id' => 'Hatchy3_', 'race_number' => 3],
            ['nickname' => 'bananajosh1', 'slug' => 'bananajosh1', 'psn_id' => 'GT_bananajosh1', 'discord_id' => 'bananajosh1', 'race_number' => 28],
            ['nickname' => 'Zac', 'slug' => 'zac-l98', 'psn_id' => 'DrGastroBoy', 'discord_id' => 'Zac_l98', 'race_number' => 20],
            ['nickname' => 'JJP', 'slug' => 'jjp', 'psn_id' => 'LordFarquaad521', 'discord_id' => 'JJP', 'race_number' => 52],
            ['nickname' => 'BKXI', 'slug' => 'bkxi', 'psn_id' => 'BKXI', 'discord_id' => 'BKXI', 'race_number' => 11],
            ['nickname' => 'sentry', 'slug' => 'sentry', 'psn_id' => 'sentryAU', 'discord_id' => 'sentry', 'race_number' => 2],
            ['nickname' => 'Kaladin', 'slug' => 'kaladin501', 'psn_id' => 'kaladin501', 'discord_id' => 'kaladin', 'race_number' => 164],
            ['nickname' => 'Danimal', 'slug' => 'danimal-242', 'psn_id' => 'danimal_242', 'discord_id' => 'danimal_242', 'race_number' => 24],
            ['nickname' => 'B. Purton', 'slug' => 'b-purton', 'psn_id' => 'Purts91', 'discord_id' => 'B.Purton', 'race_number' => 91],
            ['nickname' => 'K. N. Latkovski', 'slug' => 'nik-makozi', 'psn_id' => 'Nik_Makozi', 'discord_id' => 'k.oh.dee', 'race_number' => 7],
            ['nickname' => 'redleeTTV', 'slug' => 'redleettv', 'psn_id' => 'redleeTTV', 'discord_id' => 'redleeTTV', 'race_number' => 23],
            ['nickname' => 'RidwanF1', 'slug' => 'ridwanf1', 'psn_id' => 'RidwanF1', 'discord_id' => 'ridwanf1', 'race_number' => 14],
            ['nickname' => 'DJ ツ', 'slug' => 'dj-master', 'psn_id' => 'TheDJMaster55', 'discord_id' => 'DJ ツ', 'race_number' => 55],
        ];

        foreach ($drivers as $driverData) {
            // Create the driver with explicit slug and nickname from database
            $driver = Driver::create([
                'nickname' => $driverData['nickname'],
                'slug' => $driverData['slug'],
                'psn_id' => $driverData['psn_id'],
                'discord_id' => $driverData['discord_id'],
            ]);

            // Add driver to the league
            LeagueDriverEloquent::create([
                'league_id' => $league->id,
                'driver_id' => $driver->id,
                'driver_number' => $driverData['race_number'],
                'status' => 'active',
                'added_to_league_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}

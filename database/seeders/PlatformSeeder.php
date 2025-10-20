<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PlatformSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('platforms')->truncate();

        $platforms = [
            ['name' => 'Gran Turismo 7', 'sort_order' => 1],
            ['name' => 'iRacing', 'sort_order' => 2],
            ['name' => 'Assetto Corsa Competizione', 'sort_order' => 3],
            ['name' => 'rFactor 2', 'sort_order' => 4],
            ['name' => 'Automobilista 2', 'sort_order' => 5],
            ['name' => 'F1 24', 'sort_order' => 6],
        ];

        foreach ($platforms as $platform) {
            DB::table('platforms')->insert([
                'name' => $platform['name'],
                'slug' => Str::slug($platform['name']),
                'is_active' => true,
                'sort_order' => $platform['sort_order'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}

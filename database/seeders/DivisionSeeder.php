<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Infrastructure\Persistence\Eloquent\Models\Division;
use Illuminate\Database\Seeder;

class DivisionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * IMPORTANT: This seeder should ONLY run in local/development/staging environments.
     */
    public function run(): void
    {
        // Environment safety check - NEVER run in production
        if (app()->environment('production')) {
            $this->command->error('DivisionSeeder cannot run in production environment!');

            return;
        }

        $divisions = [
            ['id' => 1, 'season_id' => 4, 'name' => 'Division 1'],
            ['id' => 2, 'season_id' => 4, 'name' => 'Division 2'],
            ['id' => 3, 'season_id' => 4, 'name' => 'Division 3'],
            ['id' => 4, 'season_id' => 4, 'name' => 'Division 4'],
        ];

        foreach ($divisions as $divisionData) {
            Division::firstOrCreate(
                ['id' => $divisionData['id']],
                [
                    'season_id' => $divisionData['season_id'],
                    'name' => $divisionData['name'],
                ]
            );
        }

        $this->command->info('Divisions seeded successfully.');
    }
}

<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Infrastructure\Persistence\Eloquent\Models\SiteConfigModel;
use Illuminate\Database\Seeder;

class SiteConfigSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if active configuration already exists
        if (SiteConfigModel::where('is_active', true)->exists()) {
            $this->command->info('Active site configuration already exists. Skipping seeder.');
            return;
        }

        // Create default site configuration
        SiteConfigModel::create([
            'site_name' => env('APP_NAME', 'Laravel Application'),
            'timezone' => 'UTC',
            'maintenance_mode' => false,
            'user_registration_enabled' => true,
            'is_active' => true,
        ]);

        $this->command->info('Default site configuration created successfully.');
    }
}

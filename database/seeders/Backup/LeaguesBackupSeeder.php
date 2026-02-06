<?php

declare(strict_types=1);

namespace Database\Seeders\Backup;

use App\Infrastructure\Persistence\Eloquent\Models\League;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * LeaguesBackupSeeder
 *
 * This seeder restores the leagues table data from a backup.
 * Generated: 2026-02-06
 *
 * IMPORTANT: This seeder should ONLY run in local/development/staging environments.
 * Dependencies: UsersBackupSeeder must run first
 */
class LeaguesBackupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Environment safety check - NEVER run in production
        if (app()->environment('production')) {
            $this->command->error('LeaguesBackupSeeder cannot run in production environment!');
            return;
        }

        $this->command->info('Seeding leagues backup data...');

        // Disable foreign key checks temporarily
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        $leagues = [
            [
                'id' => 1,
                'name' => 'Race on Oz',
                'slug' => 'race-on-oz',
                'tagline' => 'Where Champions Are Made',
                'description' => 'Welcome to the Race on Oz! We are a community of passionate sim racers competing in exciting championships across multiple platforms.',
                'logo_path' => null,
                'header_image_path' => null,
                'banner_path' => null,
                'platform_ids' => array (
  0 => 1,
),
                'discord_url' => 'https://discord.gg/raceonoz',
                'website_url' => 'https://raceonoz.com',
                'twitter_handle' => 'raceonoz',
                'instagram_handle' => 'raceonoz',
                'youtube_url' => 'https://youtube.com/raceonoz',
                'twitch_url' => 'https://twitch.com/raceonoz',
                'facebook_handle' => null,
                'visibility' => 'public',
                'timezone' => 'Australia/Sydney',
                'owner_user_id' => 1,
                'contact_email' => null,
                'organizer_name' => null,
                'status' => 'active',
                'created_at' => '2026-02-06 05:08:50',
                'updated_at' => '2026-02-06 05:08:50',
                'deleted_at' => null,
            ],
        ];

        foreach ($leagues as $leaguesData) {
            League::updateOrCreate(
                ['id' => $leaguesData['id']],
                $leaguesData
            );
        }

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info('LeaguesBackupSeeder seeded successfully. Total records: ' . count($leagues));
    }
}

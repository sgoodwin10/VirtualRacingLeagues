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
 * Generated: 2026-02-07
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
                'logo_path' => 'leagues/logos/7LyZLW2gf50WSMQgENNLvYcuhhx4GL7JSYonf5zq.png',
                'header_image_path' => 'leagues/headers/4Db0IdQ0ZlZaunMqyjaBzLcSTkZw92dkWLZm13Gf.png',
                'banner_path' => null,
                'platform_ids' => array (
        0 => 1,
                ),
                'discord_url' => 'https://discord.gg/2GgDPcGB',
                'website_url' => 'https://raceonoz.com',
                'twitter_handle' => 'raceonoz',
                'instagram_handle' => null,
                'youtube_url' => null,
                'twitch_url' => null,
                'facebook_handle' => null,
                'visibility' => 'public',
                'timezone' => 'Australia/Sydney',
                'owner_user_id' => 1,
                'contact_email' => null,
                'organizer_name' => null,
                'status' => 'active',
                'created_at' => '2026-01-20 12:27:05',
                'updated_at' => '2026-02-03 23:58:14',
                'deleted_at' => null,
            ],
            [
                'id' => 2,
                'name' => 'Notrh Coast GT4 League',
                'slug' => 'notrh-coast-gt4-league',
                'tagline' => null,
                'description' => null,
                'logo_path' => 'leagues/logos/GHYGs6r8EbPEUAhr2jstmWE5J7xG8pVuxtMY6uLR.jpg',
                'header_image_path' => null,
                'banner_path' => null,
                'platform_ids' => array (
            0 => 1,
                ),
                'discord_url' => null,
                'website_url' => null,
                'twitter_handle' => null,
                'instagram_handle' => null,
                'youtube_url' => null,
                'twitch_url' => null,
                'facebook_handle' => null,
                'visibility' => 'public',
                'timezone' => 'Australia/Sydney',
                'owner_user_id' => 3,
                'contact_email' => null,
                'organizer_name' => null,
                'status' => 'active',
                'created_at' => '2026-01-22 09:51:14',
                'updated_at' => '2026-01-22 09:51:14',
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

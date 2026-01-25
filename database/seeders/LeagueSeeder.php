<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Models\User;
use Illuminate\Database\Seeder;

class LeagueSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the test user who will own the league
        $owner = User::where('email', 'samuel.goodwin@gmail.com')->first();

        if (! $owner) {
            $this->command->error('User not found. Please run UserSeeder first.');

            return;
        }

        // Create a default league for development
        League::firstOrCreate(
            ['slug' => 'race-on-oz'],
            [
                'owner_user_id' => $owner->id,
                'name' => 'Race on Oz',
                'tagline' => 'Where Champions Are Made',
                'description' => 'Welcome to the Race on Oz! We are a community of passionate sim racers competing in exciting championships across multiple platforms.',
                'logo_path' => null,
                'header_image_path' => null,
                'platform_ids' => [1], // iRacing
                'discord_url' => 'https://discord.gg/raceonoz',
                'website_url' => 'https://raceonoz.com',
                'twitter_handle' => 'raceonoz',
                'instagram_handle' => 'raceonoz',
                'youtube_url' => 'https://youtube.com/raceonoz',
                'twitch_url' => 'https://twitch.com/raceonoz',
                'visibility' => 'public',
                'timezone' => 'Australia/Sydney',
            ]
        );

        $this->command->info('League created successfully with ID 1.');
    }
}

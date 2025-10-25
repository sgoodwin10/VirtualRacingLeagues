<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class LeagueSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the test user who will own the league
        $owner = User::where('email', 'user@example.com')->first();

        if (!$owner) {
            $this->command->error('User not found. Please run UserSeeder first.');
            return;
        }

        // Create a default league for development
        League::firstOrCreate(
            ['slug' => 'virtual-racing-league'],
            [
                'name' => 'Virtual Racing League',
                'tagline' => 'Where Champions Are Made',
                'description' => 'Welcome to the Virtual Racing League! We are a community of passionate sim racers competing in exciting championships across multiple platforms.',
                'logo_path' => 'leagues/logos/default.png',
                'header_image_path' => null,
                'platform_ids' => [1], // Gran Turismo 7
                'discord_url' => 'https://discord.gg/example',
                'website_url' => null,
                'twitter_handle' => null,
                'instagram_handle' => null,
                'youtube_url' => null,
                'twitch_url' => null,
                'visibility' => 'public',
                'timezone' => 'Australia/Sydney',
                'owner_user_id' => $owner->id,
                'contact_email' => 'contact@example.com',
                'organizer_name' => 'VRL Admin Team',
                'status' => 'active',
            ]
        );

        $this->command->info('League created successfully with ID 1.');
    }
}

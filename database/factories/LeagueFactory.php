<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<League>
 */
final class LeagueFactory extends Factory
{
    protected $model = League::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->words(3, true),
            'slug' => $this->faker->unique()->slug(),
            'tagline' => $this->faker->sentence(),
            'description' => $this->faker->paragraph(),
            'logo_path' => 'leagues/logos/default.png',
            'header_image_path' => null,
            'platform_ids' => [1, 2],
            'visibility' => 'public',
            'timezone' => 'UTC',
            'owner_user_id' => UserEloquent::factory(),
            'contact_email' => $this->faker->safeEmail(),
            'organizer_name' => $this->faker->name(),
            'discord_url' => null,
            'website_url' => null,
            'twitter_handle' => null,
            'instagram_handle' => null,
            'youtube_url' => null,
            'twitch_url' => null,
            'status' => 'active',
        ];
    }
}

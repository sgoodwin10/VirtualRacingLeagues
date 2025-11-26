<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Infrastructure\Persistence\Eloquent\Models\Round;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\PlatformTrack;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory for creating Round test instances.
 *
 * @extends Factory<Round>
 */
final class RoundFactory extends Factory
{
    protected $model = Round::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'season_id' => SeasonEloquent::factory(),
            'round_number' => $this->faker->numberBetween(1, 20),
            'name' => $this->faker->words(3, true),
            'slug' => $this->faker->slug(),
            'scheduled_at' => $this->faker->dateTimeBetween('now', '+6 months'),
            'timezone' => 'UTC',
            'platform_track_id' => PlatformTrack::factory(),
            'track_layout' => $this->faker->optional()->randomElement(['GP', 'National', 'Short', 'Endurance']),
            'track_conditions' => $this->faker->optional()->text(100),
            'technical_notes' => $this->faker->optional()->text(200),
            'stream_url' => $this->faker->optional()->url(),
            'internal_notes' => $this->faker->optional()->text(200),
            'fastest_lap' => $this->faker->optional()->numberBetween(1, 5),
            'fastest_lap_top_10' => $this->faker->boolean(30),
            'qualifying_pole' => $this->faker->optional()->numberBetween(1, 5),
            'qualifying_pole_top_10' => $this->faker->boolean(30),
            'points_system' => null,
            'round_points' => $this->faker->boolean(20),
            'status' => $this->faker->randomElement(['scheduled', 'pre_race', 'in_progress', 'completed', 'cancelled']),
            'created_by_user_id' => User::factory(),
        ];
    }

    /**
     * Indicate the round is scheduled.
     */
    public function scheduled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'scheduled',
        ]);
    }

    /**
     * Indicate the round is in progress.
     */
    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'in_progress',
        ]);
    }

    /**
     * Indicate the round is completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
        ]);
    }
}

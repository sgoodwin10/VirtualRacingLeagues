<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Infrastructure\Persistence\Eloquent\Models\Competition>
 */
class CompetitionFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\App\Infrastructure\Persistence\Eloquent\Models\Competition>
     */
    protected $model = Competition::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        /** @var string $name */
        $name = fake()->words(3, true);

        $platformFirst = Platform::inRandomOrder()->first();

        return [
            'league_id' => League::factory(),
            'platform_id' => $platformFirst !== null ? $platformFirst->id : Platform::factory(),
            'created_by_user_id' => User::factory(),
            'name' => ucwords($name),
            'slug' => Str::slug($name),
            'description' => fake()->optional(0.7)->paragraph(),
            'logo_path' => fake()->optional(0.5)->filePath(),
            'status' => 'active',
            'archived_at' => null,
        ];
    }

    /**
     * Indicate that the competition is archived.
     */
    public function archived(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'archived',
            'archived_at' => now()->subDays(rand(1, 30)),
        ]);
    }

    /**
     * Indicate that the competition belongs to a specific league.
     */
    public function forLeague(int $leagueId): static
    {
        return $this->state(fn(array $attributes) => [
            'league_id' => $leagueId,
        ]);
    }

    /**
     * Indicate that the competition uses a specific platform.
     */
    public function forPlatform(int $platformId): static
    {
        return $this->state(fn(array $attributes) => [
            'platform_id' => $platformId,
        ]);
    }
}

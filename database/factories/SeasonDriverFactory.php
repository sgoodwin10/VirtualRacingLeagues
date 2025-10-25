<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Infrastructure\Persistence\Eloquent\Models\LeagueDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent>
 */
class SeasonDriverFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\App\Infrastructure\Persistence\Eloquent\Models\SeasonDriverEloquent>
     */
    protected $model = SeasonDriverEloquent::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'season_id' => SeasonEloquent::factory(),
            'league_driver_id' => LeagueDriverEloquent::factory(),
            'team_id' => null,
            'division_id' => null,
            'status' => fake()->randomElement(['active', 'reserve', 'withdrawn']),
            'notes' => fake()->optional(0.3)->sentence(),
            'added_at' => now(),
            'updated_at' => now(),
        ];
    }

    /**
     * Indicate that the driver is active.
     */
    public function active(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'active',
        ]);
    }

    /**
     * Indicate that the driver is a reserve.
     */
    public function reserve(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'reserve',
        ]);
    }

    /**
     * Indicate that the driver is withdrawn.
     */
    public function withdrawn(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'withdrawn',
        ]);
    }
}

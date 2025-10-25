<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Infrastructure\Persistence\Eloquent\Models\Race;
use App\Infrastructure\Persistence\Eloquent\Models\Round;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Race>
 */
final class RaceFactory extends Factory
{
    protected $model = Race::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'round_id' => Round::factory(),
            'race_number' => $this->faker->numberBetween(1, 20),
            'name' => $this->faker->words(3, true),
            'race_type' => $this->faker->randomElement(['sprint', 'feature', 'endurance', 'qualifying', 'custom']),

            // Qualifying
            'qualifying_format' => $this->faker->randomElement(['standard', 'time_trial', 'none', 'previous_race']),
            'qualifying_length' => $this->faker->optional(0.7)->numberBetween(10, 60),
            'qualifying_tire' => $this->faker->optional(0.5)->randomElement(['soft', 'medium', 'hard', 'any']),

            // Grid
            'grid_source' => $this->faker->randomElement(['qualifying', 'previous_race', 'reverse_previous', 'championship', 'reverse_championship', 'manual']),
            'grid_source_race_id' => null,

            // Length
            'length_type' => $this->faker->randomElement(['laps', 'time']),
            'length_value' => $this->faker->numberBetween(10, 120),
            'extra_lap_after_time' => $this->faker->boolean(80),

            // Platform settings
            'weather' => $this->faker->optional(0.7)->randomElement(['clear', 'wet', 'dynamic']),
            'tire_restrictions' => $this->faker->optional(0.7)->randomElement(['any', 'soft_only', 'medium_only', 'hard_only', 'multiple_required']),
            'fuel_usage' => $this->faker->optional(0.7)->randomElement(['standard', 'limited', 'unlimited']),
            'damage_model' => $this->faker->optional(0.7)->randomElement(['off', 'visual', 'mechanical', 'full', 'simulation']),

            // Penalties & Rules
            'track_limits_enforced' => $this->faker->boolean(80),
            'false_start_detection' => $this->faker->boolean(90),
            'collision_penalties' => $this->faker->boolean(70),
            'mandatory_pit_stop' => $this->faker->boolean(50),
            'minimum_pit_time' => $this->faker->optional(0.3)->numberBetween(30, 120),
            'assists_restrictions' => $this->faker->optional(0.6)->randomElement(['any', 'limited', 'none']),

            // Division
            'race_divisions' => $this->faker->boolean(30),

            // Points (F1 standard)
            'points_system' => [
                1 => 25, 2 => 18, 3 => 15, 4 => 12, 5 => 10,
                6 => 8, 7 => 6, 8 => 4, 9 => 2, 10 => 1,
            ],
            'bonus_points' => $this->faker->optional(0.3)->passthrough([
                'fastest_lap' => 1,
                'pole_position' => 1,
            ]),
            'dnf_points' => 0,
            'dns_points' => 0,

            // Notes
            'race_notes' => $this->faker->optional(0.4)->sentence(),
        ];
    }

    /**
     * Indicate that the race is a sprint race.
     */
    public function sprint(): static
    {
        return $this->state(fn(array $attributes) => [
            'race_type' => 'sprint',
            'length_type' => 'laps',
            'length_value' => $this->faker->numberBetween(10, 25),
        ]);
    }

    /**
     * Indicate that the race is a feature race.
     */
    public function feature(): static
    {
        return $this->state(fn(array $attributes) => [
            'race_type' => 'feature',
            'length_type' => 'laps',
            'length_value' => $this->faker->numberBetween(30, 60),
        ]);
    }

    /**
     * Indicate that the race is an endurance race.
     */
    public function endurance(): static
    {
        return $this->state(fn(array $attributes) => [
            'race_type' => 'endurance',
            'length_type' => 'time',
            'length_value' => $this->faker->numberBetween(60, 240),
            'mandatory_pit_stop' => true,
            'minimum_pit_time' => $this->faker->numberBetween(60, 120),
        ]);
    }

    /**
     * Indicate that the race has no qualifying.
     */
    public function noQualifying(): static
    {
        return $this->state(fn(array $attributes) => [
            'qualifying_format' => 'none',
            'qualifying_length' => null,
            'qualifying_tire' => null,
        ]);
    }

    /**
     * Indicate that the race uses time-based length.
     */
    public function timeBased(): static
    {
        return $this->state(fn(array $attributes) => [
            'length_type' => 'time',
            'length_value' => $this->faker->numberBetween(30, 120),
            'extra_lap_after_time' => true,
        ]);
    }

    /**
     * Indicate that the race uses laps-based length.
     */
    public function lapsBased(): static
    {
        return $this->state(fn(array $attributes) => [
            'length_type' => 'laps',
            'length_value' => $this->faker->numberBetween(20, 80),
        ]);
    }
}

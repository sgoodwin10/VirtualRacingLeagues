<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Infrastructure\Persistence\Eloquent\Models\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent>
 */
class SeasonFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent>
     */
    protected $model = SeasonEloquent::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->words(2, true);
        if (is_array($name)) {
            $name = implode(' ', $name);
        }
        $name = $name . ' ' . fake()->year();

        return [
            'competition_id' => Competition::factory(),
            'created_by_user_id' => User::factory(),
            'name' => ucwords($name),
            'slug' => Str::slug($name),
            'car_class' => fake()->optional(0.7)->randomElement(['GT3', 'F1', 'LMP1', 'GTE']),
            'description' => fake()->optional(0.7)->paragraph(),
            'technical_specs' => fake()->optional(0.5)->paragraph(),
            'logo_path' => fake()->optional(0.5)->filePath(),
            'banner_path' => fake()->optional(0.5)->filePath(),
            'team_championship_enabled' => fake()->boolean(50),
            'race_divisions_enabled' => fake()->boolean(50),
            'status' => 'active',
        ];
    }

    /**
     * Indicate that team championship is enabled.
     */
    public function withTeamChampionship(): static
    {
        return $this->state(fn (array $attributes) => [
            'team_championship_enabled' => true,
        ]);
    }

    /**
     * Indicate that race divisions are enabled.
     */
    public function withDivisions(): static
    {
        return $this->state(fn (array $attributes) => [
            'race_divisions_enabled' => true,
        ]);
    }
}

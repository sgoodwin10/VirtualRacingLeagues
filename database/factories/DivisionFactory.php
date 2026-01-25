<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Infrastructure\Persistence\Eloquent\Models\Division;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Infrastructure\Persistence\Eloquent\Models\Division>
 */
class DivisionFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\App\Infrastructure\Persistence\Eloquent\Models\Division>
     */
    protected $model = Division::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $divisionNames = ['Pro Division', 'Amateur Division', 'Elite Division', 'Division A', 'Division B'];

        return [
            'season_id' => SeasonEloquent::factory(),
            'name' => fake()->randomElement($divisionNames),
            'description' => fake()->optional(0.6)->realText(200),
            'logo_url' => fake()->optional(0.3)->filePath(),
        ];
    }

    /**
     * Indicate that the division has no description.
     */
    public function withoutDescription(): static
    {
        return $this->state(fn (array $attributes) => [
            'description' => null,
        ]);
    }

    /**
     * Indicate that the division has a logo.
     */
    public function withLogo(): static
    {
        return $this->state(fn (array $attributes) => [
            'logo_url' => 'divisions/logos/division-' . fake()->uuid() . '.png',
        ]);
    }
}

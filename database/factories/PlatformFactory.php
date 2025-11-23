<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Platform>
 */
final class PlatformFactory extends Factory
{
    protected $model = Platform::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $baseName = $this->faker->randomElement([
            'Gran Turismo 7',
            'iRacing',
            'Assetto Corsa Competizione',
            'rFactor 2',
            'Automobilista 2',
            'F1 24',
            'Project CARS 3',
            'Forza Motorsport',
            'RaceRoom Racing Experience',
            'BeamNG.drive',
            'Kartkraft',
            'Dirt Rally 2.0',
            'WRC 10',
            'NASCAR 21',
            'MotoGP 23',
            'F1 23',
            'F1 22',
            'Le Mans Ultimate',
        ]);

        // Generate unique name and slug by appending a random string
        // This prevents conflicts when multiple platforms might be created by factories
        $uniqueSuffix = Str::random(8);
        $uniqueName = $baseName . ' ' . $uniqueSuffix;
        $uniqueSlug = Str::slug($baseName) . '-' . strtolower($uniqueSuffix);

        return [
            'name' => $uniqueName,
            'slug' => $uniqueSlug,
            'description' => $this->faker->optional(0.7)->sentence(),
            'logo_url' => null,
            'is_active' => $this->faker->boolean(90),
            'sort_order' => $this->faker->numberBetween(1, 100),
        ];
    }

    /**
     * Indicate that the platform is active.
     */
    public function active(): static
    {
        return $this->state(fn(array $attributes) => [
            'is_active' => true,
        ]);
    }

    /**
     * Indicate that the platform is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn(array $attributes) => [
            'is_active' => false,
        ]);
    }
}

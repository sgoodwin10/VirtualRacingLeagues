<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Infrastructure\Persistence\Eloquent\Models\PlatformTrackLocation;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<PlatformTrackLocation>
 */
class PlatformTrackLocationFactory extends Factory
{
    protected $model = PlatformTrackLocation::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->city() . ' Circuit';

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'country' => fake()->country(),
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    /**
     * Indicate that the location is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}

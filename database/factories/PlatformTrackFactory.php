<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use App\Infrastructure\Persistence\Eloquent\Models\PlatformTrack;
use App\Infrastructure\Persistence\Eloquent\Models\PlatformTrackLocation;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<PlatformTrack>
 */
class PlatformTrackFactory extends Factory
{
    protected $model = PlatformTrack::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        /** @var string $name */
        $name = fake()->words(2, true);

        return [
            'platform_id' => Platform::factory(),
            'platform_track_location_id' => PlatformTrackLocation::factory(),
            'name' => ucwords($name),
            'slug' => Str::slug($name),
            'is_reverse' => fake()->boolean(20),
            'image_path' => null,
            'length_meters' => fake()->numberBetween(1000, 8000),
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    /**
     * Indicate that the track is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Indicate that the track is a reverse layout.
     */
    public function reverse(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_reverse' => true,
        ]);
    }
}

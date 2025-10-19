<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Infrastructure\Persistence\Eloquent\Models\Driver;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Driver>
 */
final class DriverFactory extends Factory
{
    protected $model = Driver::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'nickname' => $this->faker->optional()->userName(),
            'email' => $this->faker->optional()->email(),
            'phone' => $this->faker->optional()->phoneNumber(),
            'psn_id' => $this->faker->unique()->userName(),
            'gt7_id' => $this->faker->optional()->userName(),
            'iracing_id' => $this->faker->optional()->userName(),
            'iracing_customer_id' => $this->faker->optional()->numberBetween(1, 999999),
        ];
    }
}

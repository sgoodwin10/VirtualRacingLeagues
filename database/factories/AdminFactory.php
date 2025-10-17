<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Infrastructure\Persistence\Eloquent\Models\AdminEloquent;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<AdminEloquent>
 */
class AdminFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<AdminEloquent>
     */
    protected $model = AdminEloquent::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'password' => Hash::make('password'), // Default password for testing
            'role' => 'admin',
            'status' => 'active',
            'last_login_at' => null,
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the admin is a super admin.
     *
     * @return static
     */
    public function superAdmin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'super_admin',
        ]);
    }

    /**
     * Indicate that the admin is an admin.
     *
     * @return static
     */
    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'admin',
        ]);
    }

    /**
     * Indicate that the admin is a moderator.
     *
     * @return static
     */
    public function moderator(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'moderator',
        ]);
    }

    /**
     * Indicate that the admin account is inactive.
     *
     * @return static
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
        ]);
    }

    /**
     * Indicate that the admin account is active.
     *
     * @return static
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }
}

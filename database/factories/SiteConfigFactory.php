<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Infrastructure\Persistence\Eloquent\Models\SiteConfigModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SiteConfigModel>
 */
class SiteConfigFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<SiteConfigModel>
     */
    protected $model = SiteConfigModel::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'site_name' => $this->faker->company(),
            'google_tag_manager_id' => $this->faker->optional()->regexify('GTM-[A-Z0-9]{7}'),
            'google_analytics_id' => $this->faker->optional()->regexify('G-[A-Z0-9]{10}'),
            'google_search_console_code' => $this->faker->optional()->uuid(),
            'discord_link' => $this->faker->optional()->url(),
            'support_email' => $this->faker->optional()->safeEmail(),
            'contact_email' => $this->faker->optional()->safeEmail(),
            'admin_email' => $this->faker->optional()->safeEmail(),
            'maintenance_mode' => false,
            'timezone' => $this->faker->timezone(),
            'user_registration_enabled' => true,
            'is_active' => true,
        ];
    }

    /**
     * Indicate that the site is in maintenance mode.
     *
     * @return static
     */
    public function maintenanceMode(): static
    {
        return $this->state(fn(array $attributes) => [
            'maintenance_mode' => true,
        ]);
    }

    /**
     * Indicate that user registration is disabled.
     *
     * @return static
     */
    public function registrationDisabled(): static
    {
        return $this->state(fn(array $attributes) => [
            'user_registration_enabled' => false,
        ]);
    }

    /**
     * Indicate that the site config is inactive.
     *
     * @return static
     */
    public function inactive(): static
    {
        return $this->state(fn(array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Indicate that the site config is active (default).
     *
     * @return static
     */
    public function active(): static
    {
        return $this->state(fn(array $attributes) => [
            'is_active' => true,
        ]);
    }
}

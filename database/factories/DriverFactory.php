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
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $nickname = $this->faker->optional()->userName();

        // Generate slug from name components
        $slug = $this->generateSlug($firstName, $lastName, $nickname);

        return [
            'first_name' => $firstName,
            'last_name' => $lastName,
            'nickname' => $nickname,
            'slug' => $slug,
            'email' => $this->faker->optional()->email(),
            'phone' => $this->faker->optional()->phoneNumber(),
            'psn_id' => $this->faker->unique()->userName(),
            'iracing_id' => $this->faker->optional()->userName(),
            'iracing_customer_id' => $this->faker->optional()->numberBetween(1, 999999),
        ];
    }

    /**
     * Generate a URL-friendly slug from name components.
     */
    private function generateSlug(?string $firstName, ?string $lastName, ?string $nickname): string
    {
        $hasFirstName = $firstName !== null && trim($firstName) !== '';
        $hasLastName = $lastName !== null && trim($lastName) !== '';

        $baseSlug = '';

        if ($hasFirstName && $hasLastName) {
            $baseSlug = $firstName . ' ' . $lastName;
        } elseif ($nickname !== null && trim($nickname) !== '') {
            $baseSlug = $nickname;
        } elseif ($hasFirstName) {
            $baseSlug = $firstName;
        } elseif ($hasLastName) {
            $baseSlug = $lastName;
        }

        return $this->slugify($baseSlug);
    }

    /**
     * Convert a string to a URL-friendly slug.
     */
    private function slugify(string $value): string
    {
        $slug = mb_strtolower($value, 'UTF-8');
        $slug = preg_replace('/[\s_]+/', '-', $slug) ?? $slug;
        $slug = preg_replace('/[^\p{L}\p{N}\-]/u', '', $slug) ?? $slug;
        $slug = preg_replace('/-+/', '-', $slug) ?? $slug;
        $slug = trim($slug, '-');

        return $slug;
    }
}

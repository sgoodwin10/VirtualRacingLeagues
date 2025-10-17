<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Feature tests for user profile management.
 */
class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_update_profile(): void
    {
        $user = User::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'password' => bcrypt('password123'),
        ]);

        $this->actingAs($user, 'web');

        $response = $this->putJson('/api/profile', [
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => 'john@example.com',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'user' => ['id', 'first_name', 'last_name', 'email', 'email_verified_at'],
                'message',
            ],
        ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'first_name' => 'Jane',
            'last_name' => 'Smith',
        ]);
    }

    public function test_user_can_change_email(): void
    {
        $user = User::factory()->create([
            'email' => 'old@example.com',
            'email_verified_at' => now(),
        ]);

        $this->actingAs($user, 'web');

        $response = $this->putJson('/api/profile', [
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => 'new@example.com',
        ]);

        $response->assertStatus(200);

        // Email should be updated and verification reset
        $updatedUser = $user->fresh();
        $this->assertEquals('new@example.com', $updatedUser->email);
        $this->assertNull($updatedUser->email_verified_at);
    }

    public function test_user_can_update_password(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('old-password'),
        ]);

        $this->actingAs($user, 'web');

        $response = $this->putJson('/api/profile', [
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
            'current_password' => 'old-password',
        ]);

        $response->assertStatus(200);

        // Verify password was changed
        $this->assertTrue(Hash::check('new-password123', $user->fresh()->password));
    }

    public function test_password_update_requires_current_password(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->putJson('/api/profile', [
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['current_password']);
    }

    public function test_password_update_fails_with_incorrect_current_password(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('correct-password'),
        ]);

        $this->actingAs($user, 'web');

        $response = $this->putJson('/api/profile', [
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
            'current_password' => 'wrong-password',
        ]);

        $response->assertStatus(422);
    }

    public function test_profile_update_requires_all_fields(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->putJson('/api/profile', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['first_name', 'last_name', 'email']);
    }

    public function test_profile_update_requires_unique_email(): void
    {
        $existingUser = User::factory()->create(['email' => 'existing@example.com']);
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->putJson('/api/profile', [
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => 'existing@example.com',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_guest_cannot_update_profile(): void
    {
        $response = $this->putJson('/api/profile', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
        ]);

        $response->assertStatus(401);
    }

    public function test_profile_update_requires_first_name(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->putJson('/api/profile', [
            'last_name' => 'Doe',
            'email' => $user->email,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['first_name']);
    }

    public function test_profile_update_requires_last_name(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->putJson('/api/profile', [
            'first_name' => 'John',
            'email' => $user->email,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['last_name']);
    }

    public function test_profile_update_validates_first_name_max_length(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->putJson('/api/profile', [
            'first_name' => str_repeat('a', 256),
            'last_name' => 'Doe',
            'email' => $user->email,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['first_name']);
    }

    public function test_profile_update_validates_last_name_max_length(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web');

        $response = $this->putJson('/api/profile', [
            'first_name' => 'John',
            'last_name' => str_repeat('a', 256),
            'email' => $user->email,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['last_name']);
    }
}

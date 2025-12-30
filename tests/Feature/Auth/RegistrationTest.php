<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Notifications\EmailVerificationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Spatie\Activitylog\Models\Activity;
use Tests\TestCase;

/**
 * Feature tests for user registration.
 */
class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/register', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => ['message', 'user' => ['id', 'email']],
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
            'first_name' => 'John',
            'last_name' => 'Doe',
        ]);
    }

    public function test_registration_requires_all_fields(): void
    {
        $response = $this->postJson('/api/register', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['first_name', 'last_name', 'email', 'password']);
    }

    public function test_registration_requires_valid_email(): void
    {
        $response = $this->postJson('/api/register', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'invalid-email',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_registration_requires_unique_email(): void
    {
        // Create existing user
        User::factory()->create(['email' => 'john@example.com']);

        $response = $this->postJson('/api/register', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_registration_requires_password_confirmation(): void
    {
        $response = $this->postJson('/api/register', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'different-password',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    public function test_registration_requires_minimum_password_length(): void
    {
        $response = $this->postJson('/api/register', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'password' => 'short',
            'password_confirmation' => 'short',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    public function test_registration_requires_first_name(): void
    {
        $response = $this->postJson('/api/register', [
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['first_name']);
    }

    public function test_registration_requires_last_name(): void
    {
        $response = $this->postJson('/api/register', [
            'first_name' => 'John',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['last_name']);
    }

    public function test_registration_validates_first_name_max_length(): void
    {
        $response = $this->postJson('/api/register', [
            'first_name' => str_repeat('a', 256),
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['first_name']);
    }

    public function test_registration_validates_last_name_max_length(): void
    {
        $response = $this->postJson('/api/register', [
            'first_name' => 'John',
            'last_name' => str_repeat('a', 256),
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['last_name']);
    }

    public function test_user_registration_is_logged_with_context(): void
    {
        $this->markTestSkipped('Activity logging not yet implemented for user registration');

        // Clear any existing activity
        Activity::truncate();

        Notification::fake();

        $this->withHeaders([
            'User-Agent' => 'Test Browser/1.0',
        ])->postJson('/api/register', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $user = User::where('email', 'john@example.com')->first();
        $this->assertNotNull($user);

        // Check that user creation was logged with enhanced context
        $activity = Activity::where('log_name', 'user')
            ->where('description', 'created user')
            ->where('subject_type', User::class)
            ->where('subject_id', $user->id)
            ->first();

        $this->assertNotNull($activity);
        $this->assertArrayHasKey('attributes', $activity->properties);
        $this->assertArrayHasKey('registration_source', $activity->properties);
        $this->assertEquals('self', $activity->properties['registration_source']);
        $this->assertArrayHasKey('ip_address', $activity->properties);
        $this->assertArrayHasKey('user_agent', $activity->properties);
        $this->assertEquals('Test Browser/1.0', $activity->properties['user_agent']);
        $this->assertArrayHasKey('registered_at', $activity->properties);

        // Verify attributes
        $this->assertEquals('john@example.com', $activity->properties['attributes']['email']);
        $this->assertEquals('John', $activity->properties['attributes']['first_name']);
        $this->assertEquals('Doe', $activity->properties['attributes']['last_name']);
    }

    public function test_registration_sends_exactly_one_verification_email(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/register', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201);

        $user = User::where('email', 'john@example.com')->first();
        $this->assertNotNull($user);

        // Assert that exactly ONE email verification notification was sent
        Notification::assertSentTo(
            [$user],
            EmailVerificationNotification::class,
            function ($notification, $channels) {
                return in_array('mail', $channels);
            }
        );

        // Assert it was sent only once (not twice)
        Notification::assertCount(1);
    }
}

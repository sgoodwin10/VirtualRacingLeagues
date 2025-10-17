<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\URL;
use Spatie\Activitylog\Models\Activity;
use Tests\TestCase;

/**
 * Feature tests for email verification activity logging.
 */
class EmailVerificationLoggingTest extends TestCase
{
    use RefreshDatabase;

    public function test_email_verification_request_is_logged(): void
    {
        // Clear any existing activity
        Activity::truncate();

        $this->postJson('/api/register', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $user = User::where('email', 'john@example.com')->first();
        $this->assertNotNull($user);

        // Check that email verification requested was logged
        $activity = Activity::where('log_name', 'user')
            ->where('description', 'email verification requested')
            ->where('subject_type', User::class)
            ->where('subject_id', $user->id)
            ->first();

        $this->assertNotNull($activity);
        $this->assertEquals($user->id, $activity->causer_id);
        $this->assertEquals(User::class, $activity->causer_type);
        $this->assertArrayHasKey('email', $activity->properties);
        $this->assertEquals('john@example.com', $activity->properties['email']);
        $this->assertArrayHasKey('ip_address', $activity->properties);
        $this->assertArrayHasKey('user_agent', $activity->properties);
    }

    public function test_email_verification_completion_is_logged(): void
    {
        // Clear any existing activity
        Activity::truncate();

        $user = User::factory()->create([
            'email_verified_at' => null,
        ]);

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)]
        );

        $response = $this->get($verificationUrl);
        $response->assertRedirect('/verify-email-result?status=success');

        // Check that email verified was logged
        $activity = Activity::where('log_name', 'user')
            ->where('description', 'email verified')
            ->where('subject_type', User::class)
            ->where('subject_id', $user->id)
            ->first();

        $this->assertNotNull($activity);
        $this->assertEquals($user->id, $activity->causer_id);
        $this->assertEquals(User::class, $activity->causer_type);
        $this->assertArrayHasKey('email', $activity->properties);
        $this->assertEquals($user->email, $activity->properties['email']);
        $this->assertArrayHasKey('verified_at', $activity->properties);
        $this->assertArrayHasKey('ip_address', $activity->properties);
    }

    public function test_email_verification_resend_is_logged(): void
    {
        // Clear any existing activity
        Activity::truncate();

        $user = User::factory()->create([
            'email_verified_at' => null,
        ]);

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/email/resend');
        $response->assertStatus(200);

        // Check that email verification requested was logged
        $activity = Activity::where('log_name', 'user')
            ->where('description', 'email verification requested')
            ->where('subject_type', User::class)
            ->where('subject_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->first();

        $this->assertNotNull($activity);
        $this->assertEquals($user->id, $activity->causer_id);
        $this->assertEquals(User::class, $activity->causer_type);
        $this->assertArrayHasKey('email', $activity->properties);
        $this->assertEquals($user->email, $activity->properties['email']);
        $this->assertArrayHasKey('ip_address', $activity->properties);
        $this->assertArrayHasKey('user_agent', $activity->properties);
    }
}

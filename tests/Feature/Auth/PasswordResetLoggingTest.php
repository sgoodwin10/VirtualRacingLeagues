<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Password;
use Spatie\Activitylog\Models\Activity;
use Tests\TestCase;

/**
 * Feature tests for password reset activity logging.
 */
class PasswordResetLoggingTest extends TestCase
{
    use RefreshDatabase;

    public function test_password_reset_request_is_logged(): void
    {
        // Clear any existing activity
        Activity::truncate();

        $user = User::factory()->create();

        $response = $this->postJson('/api/forgot-password', [
            'email' => $user->email,
        ]);

        $response->assertStatus(200);

        // Check that password reset requested was logged
        $activity = Activity::where('log_name', 'user')
            ->where('description', 'password reset requested')
            ->where('subject_type', User::class)
            ->where('subject_id', $user->id)
            ->first();

        $this->assertNotNull($activity);
        $this->assertEquals($user->id, $activity->causer_id);
        $this->assertEquals(User::class, $activity->causer_type);
        $this->assertArrayHasKey('email', $activity->properties);
        $this->assertEquals($user->email, $activity->properties['email']);
        $this->assertArrayHasKey('ip_address', $activity->properties);
        $this->assertArrayHasKey('user_agent', $activity->properties);
    }

    public function test_password_reset_completion_is_logged(): void
    {
        // Clear any existing activity
        Activity::truncate();

        $user = User::factory()->create();

        // Create a valid password reset token
        $token = Password::broker('users')->createToken($user);

        $response = $this->postJson('/api/reset-password', [
            'email' => $user->email,
            'token' => $token,
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertStatus(200);

        // Check that password reset completed was logged
        $activity = Activity::where('log_name', 'user')
            ->where('description', 'password reset completed')
            ->where('subject_type', User::class)
            ->where('subject_id', $user->id)
            ->first();

        $this->assertNotNull($activity);
        $this->assertEquals($user->id, $activity->causer_id);
        $this->assertEquals(User::class, $activity->causer_type);
        $this->assertArrayHasKey('email', $activity->properties);
        $this->assertEquals($user->email, $activity->properties['email']);
        $this->assertArrayHasKey('reset_at', $activity->properties);
        $this->assertArrayHasKey('ip_address', $activity->properties);
    }

    public function test_password_reset_request_logs_correct_context(): void
    {
        // Clear any existing activity
        Activity::truncate();

        $user = User::factory()->create();

        $this->withHeaders([
            'User-Agent' => 'Test Browser/1.0',
        ])->postJson('/api/forgot-password', [
            'email' => $user->email,
        ]);

        $activity = Activity::where('log_name', 'user')
            ->where('description', 'password reset requested')
            ->where('subject_id', $user->id)
            ->first();

        $this->assertNotNull($activity);
        $this->assertArrayHasKey('user_agent', $activity->properties);
        $this->assertEquals('Test Browser/1.0', $activity->properties['user_agent']);
    }
}

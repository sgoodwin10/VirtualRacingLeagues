<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Activitylog\Models\Activity;
use Tests\TestCase;

/**
 * Feature tests for login/logout activity logging.
 */
class LoginLoggingTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_login_is_logged(): void
    {
        // Clear any existing activity
        Activity::truncate();

        $user = User::factory()->create([
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertStatus(200);

        // Check that user login was logged
        $activity = Activity::where('log_name', 'user')
            ->where('description', 'user logged in')
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
        $this->assertArrayHasKey('logged_in_at', $activity->properties);
    }

    public function test_user_logout_is_logged(): void
    {
        // Clear any existing activity
        Activity::truncate();

        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/logout');

        $response->assertStatus(200);

        // Check that user logout was logged
        $activity = Activity::where('log_name', 'user')
            ->where('description', 'user logged out')
            ->where('subject_type', User::class)
            ->where('subject_id', $user->id)
            ->first();

        $this->assertNotNull($activity);
        $this->assertEquals($user->id, $activity->causer_id);
        $this->assertEquals(User::class, $activity->causer_type);
        $this->assertArrayHasKey('email', $activity->properties);
        $this->assertEquals($user->email, $activity->properties['email']);
        $this->assertArrayHasKey('ip_address', $activity->properties);
        $this->assertArrayHasKey('logged_out_at', $activity->properties);
    }

    public function test_failed_login_does_not_log_activity(): void
    {
        // Clear any existing activity
        Activity::truncate();

        $user = User::factory()->create([
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422);

        // Check that no login activity was logged
        $activity = Activity::where('log_name', 'user')
            ->where('description', 'user logged in')
            ->where('subject_id', $user->id)
            ->first();

        $this->assertNull($activity);
    }

    public function test_login_logs_correct_context(): void
    {
        // Clear any existing activity
        Activity::truncate();

        $user = User::factory()->create([
            'password' => bcrypt('password123'),
        ]);

        $this->withHeaders([
            'User-Agent' => 'Test Browser/1.0',
        ])->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $activity = Activity::where('log_name', 'user')
            ->where('description', 'user logged in')
            ->where('subject_id', $user->id)
            ->first();

        $this->assertNotNull($activity);
        $this->assertArrayHasKey('user_agent', $activity->properties);
        $this->assertEquals('Test Browser/1.0', $activity->properties['user_agent']);
    }
}

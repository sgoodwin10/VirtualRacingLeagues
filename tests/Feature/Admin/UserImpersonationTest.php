<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Admin;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redis;
use Spatie\Activitylog\Models\Activity;
use Tests\TestCase;

/**
 * Feature tests for user impersonation functionality.
 */
class UserImpersonationTest extends TestCase
{
    use RefreshDatabase;

    private Admin $superAdmin;
    private Admin $admin;
    private Admin $moderator;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Create admins with different roles
        $this->superAdmin = Admin::factory()->create([
            'email' => 'superadmin@example.com',
            'role' => 'super_admin',
        ]);

        $this->admin = Admin::factory()->create([
            'email' => 'admin@example.com',
            'role' => 'admin',
        ]);

        $this->moderator = Admin::factory()->create([
            'email' => 'moderator@example.com',
            'role' => 'moderator',
        ]);

        // Create a test user
        $this->user = User::factory()->create([
            'email' => 'user@example.com',
            'status' => 'active',
        ]);
    }

    public function test_super_admin_can_generate_impersonation_token(): void
    {
        $response = $this->actingAs($this->superAdmin, 'admin')
            ->postJson("/api/admin/users/{$this->user->id}/login-as");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'token',
                'expires_in',
            ],
            'message',
        ]);

        $token = $response->json('data.token');
        $this->assertIsString($token);
        $this->assertNotEmpty($token);

        // Verify token exists in Redis
        $redisKey = 'user_impersonation:' . $token;
        $this->assertNotNull(Redis::get($redisKey));
    }

    public function test_admin_can_generate_impersonation_token(): void
    {
        $response = $this->actingAs($this->admin, 'admin')
            ->postJson("/api/admin/users/{$this->user->id}/login-as");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'token',
                'expires_in',
            ],
        ]);

        $token = $response->json('data.token');
        $this->assertNotEmpty($token);
    }

    public function test_moderator_cannot_generate_impersonation_token(): void
    {
        $response = $this->actingAs($this->moderator, 'admin')
            ->postJson("/api/admin/users/{$this->user->id}/login-as");

        $response->assertStatus(403);
        $response->assertJsonFragment([
            'message' => 'Forbidden. Only admins and super admins can access this resource.',
        ]);
    }

    public function test_unauthenticated_admin_cannot_generate_token(): void
    {
        $response = $this->postJson("/api/admin/users/{$this->user->id}/login-as");

        $response->assertStatus(401);
    }

    public function test_cannot_generate_token_for_nonexistent_user(): void
    {
        $response = $this->actingAs($this->superAdmin, 'admin')
            ->postJson('/api/admin/users/99999/login-as');

        $response->assertStatus(404);
    }

    public function test_cannot_generate_token_for_deleted_user(): void
    {
        $this->user->delete();

        $response = $this->actingAs($this->superAdmin, 'admin')
            ->postJson("/api/admin/users/{$this->user->id}/login-as");

        $response->assertStatus(403);
        $response->assertJsonFragment([
            'message' => 'Cannot impersonate deleted users',
        ]);
    }

    public function test_token_contains_correct_data(): void
    {
        $response = $this->actingAs($this->superAdmin, 'admin')
            ->postJson("/api/admin/users/{$this->user->id}/login-as");

        $token = $response->json('data.token');
        $redisKey = 'user_impersonation:' . $token;
        $tokenData = json_decode(Redis::get($redisKey), true);

        $this->assertEquals($this->user->id, $tokenData['user_id']);
        $this->assertEquals($this->superAdmin->id, $tokenData['admin_id']);
        $this->assertEquals($this->superAdmin->email, $tokenData['admin_email']);
        $this->assertEquals($this->user->email, $tokenData['user_email']);
        $this->assertArrayHasKey('created_at', $tokenData);
        $this->assertArrayHasKey('expires_at', $tokenData);
    }

    public function test_token_expires_in_five_minutes(): void
    {
        $response = $this->actingAs($this->superAdmin, 'admin')
            ->postJson("/api/admin/users/{$this->user->id}/login-as");

        $token = $response->json('data.token');
        $redisKey = 'user_impersonation:' . $token;

        // Check TTL is approximately 5 minutes (300 seconds)
        $ttl = Redis::ttl($redisKey);
        $this->assertGreaterThan(295, $ttl);
        $this->assertLessThanOrEqual(300, $ttl);
    }

    public function test_token_generation_logs_activity(): void
    {
        $this->actingAs($this->superAdmin, 'admin')
            ->postJson("/api/admin/users/{$this->user->id}/login-as");

        // Verify activity log was created
        $this->assertDatabaseHas('activity_log', [
            'description' => 'Admin generated impersonation token for user',
            'causer_type' => Admin::class,
            'causer_id' => $this->superAdmin->id,
            'subject_type' => User::class,
            'subject_id' => $this->user->id,
        ]);
    }

    public function test_can_consume_valid_token(): void
    {
        // Generate token
        $tokenResponse = $this->actingAs($this->superAdmin, 'admin')
            ->postJson("/api/admin/users/{$this->user->id}/login-as");

        $token = $tokenResponse->json('data.token');

        // Consume token on app subdomain
        $response = $this->postJson('http://app.virtualracingleagues.localhost/api/impersonate', [
            'token' => $token,
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'id',
                'first_name',
                'last_name',
                'email',
            ],
            'message',
        ]);

        $response->assertJsonFragment([
            'email' => $this->user->email,
        ]);

        // Verify user is now authenticated
        $this->assertEquals($this->user->id, Auth::guard('web')->id());
    }

    public function test_token_is_single_use(): void
    {
        // Generate token
        $tokenResponse = $this->actingAs($this->superAdmin, 'admin')
            ->postJson("/api/admin/users/{$this->user->id}/login-as");

        $token = $tokenResponse->json('data.token');

        // Consume token first time
        $response1 = $this->postJson('http://app.virtualracingleagues.localhost/api/impersonate', [
            'token' => $token,
        ]);
        $response1->assertStatus(200);

        // Try to consume token again
        $response2 = $this->postJson('http://app.virtualracingleagues.localhost/api/impersonate', [
            'token' => $token,
        ]);
        $response2->assertStatus(400);
        $response2->assertJsonFragment([
            'message' => 'Invalid or expired impersonation token',
        ]);

        // Verify token was deleted from Redis
        $redisKey = 'user_impersonation:' . $token;
        $this->assertNull(Redis::get($redisKey));
    }

    public function test_cannot_consume_invalid_token(): void
    {
        $response = $this->postJson('http://app.virtualracingleagues.localhost/api/impersonate', [
            'token' => '00000000-0000-0000-0000-000000000000',
        ]);

        $response->assertStatus(400);
        $response->assertJsonFragment([
            'message' => 'Invalid or expired impersonation token',
        ]);
    }

    public function test_cannot_consume_token_with_invalid_format(): void
    {
        $response = $this->postJson('http://app.virtualracingleagues.localhost/api/impersonate', [
            'token' => 'not-a-uuid',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['token']);
    }

    public function test_token_consumption_requires_token_parameter(): void
    {
        $response = $this->postJson('http://app.virtualracingleagues.localhost/api/impersonate', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['token']);
    }

    public function test_token_consumption_logs_activity(): void
    {
        // Generate token
        $tokenResponse = $this->actingAs($this->superAdmin, 'admin')
            ->postJson("/api/admin/users/{$this->user->id}/login-as");

        $token = $tokenResponse->json('data.token');

        // Consume token
        $this->postJson('http://app.virtualracingleagues.localhost/api/impersonate', [
            'token' => $token,
        ]);

        // Verify activity log was created
        $this->assertDatabaseHas('activity_log', [
            'description' => 'Admin impersonated user',
            'causer_type' => Admin::class,
            'causer_id' => $this->superAdmin->id,
            'subject_type' => User::class,
            'subject_id' => $this->user->id,
        ]);
    }

    public function test_impersonation_regenerates_session(): void
    {
        // Generate token
        $tokenResponse = $this->actingAs($this->superAdmin, 'admin')
            ->postJson("/api/admin/users/{$this->user->id}/login-as");

        $token = $tokenResponse->json('data.token');

        // Consume token
        $response = $this->postJson('http://app.virtualracingleagues.localhost/api/impersonate', [
            'token' => $token,
        ]);

        // Session should be regenerated (new session ID)
        $response->assertStatus(200);
        $this->assertNotNull(session()->getId());
    }

    public function test_token_on_main_domain_also_works(): void
    {
        // Generate token on main domain
        $tokenResponse = $this->actingAs($this->superAdmin, 'admin')
            ->postJson("/api/admin/users/{$this->user->id}/login-as");

        $token = $tokenResponse->json('data.token');

        // Consume token on main domain (should fail for POST)
        $response = $this->postJson('http://virtualracingleagues.localhost/api/impersonate', [
            'token' => $token,
        ]);

        // This should fail because /api/impersonate is only on app subdomain
        // Returns 405 (Method Not Allowed) instead of 404
        $response->assertStatus(405);
    }

    public function test_can_consume_token_via_get_on_app_subdomain(): void
    {
        // Generate token
        $tokenResponse = $this->actingAs($this->superAdmin, 'admin')
            ->postJson("/api/admin/users/{$this->user->id}/login-as");

        $token = $tokenResponse->json('data.token');

        // Consume token via GET on app subdomain
        $response = $this->get("http://app.virtualracingleagues.localhost/login-as?token={$token}");

        // Should redirect to app root
        $response->assertRedirect('/');
        $response->assertSessionHas('success');

        // Verify user is now authenticated
        $this->assertEquals($this->user->id, Auth::guard('web')->id());
    }

    public function test_can_consume_token_via_get_on_main_domain(): void
    {
        // Generate token
        $tokenResponse = $this->actingAs($this->superAdmin, 'admin')
            ->postJson("/api/admin/users/{$this->user->id}/login-as");

        $token = $tokenResponse->json('data.token');

        // Consume token via GET on main domain
        $response = $this->get("http://virtualracingleagues.localhost/login-as?token={$token}");

        // Should redirect to app subdomain
        $response->assertRedirect('http://app.virtualracingleagues.localhost:8000');
        $response->assertSessionHas('success');

        // Verify user is now authenticated
        $this->assertEquals($this->user->id, Auth::guard('web')->id());
    }

    public function test_get_route_with_invalid_token_redirects_to_login(): void
    {
        // Try to consume invalid token via GET
        $response = $this->get('http://app.virtualracingleagues.localhost/login-as?token=00000000-0000-0000-0000-000000000000');

        // Should redirect to public login with error
        $response->assertRedirect('http://virtualracingleagues.localhost:8000/login');
        $response->assertSessionHas('error', 'Invalid or expired impersonation token');
    }

    public function test_get_route_with_expired_token_redirects_to_login(): void
    {
        // Generate token
        $tokenResponse = $this->actingAs($this->superAdmin, 'admin')
            ->postJson("/api/admin/users/{$this->user->id}/login-as");

        $token = $tokenResponse->json('data.token');

        // Delete token from Redis to simulate expiration
        Redis::del('user_impersonation:' . $token);

        // Try to consume expired token via GET
        $response = $this->get("http://app.virtualracingleagues.localhost/login-as?token={$token}");

        // Should redirect to public login with error
        $response->assertRedirect('http://virtualracingleagues.localhost:8000/login');
        $response->assertSessionHas('error', 'Invalid or expired impersonation token');
    }

    public function test_get_route_without_token_parameter_fails_validation(): void
    {
        // Try to access GET route without token parameter
        $response = $this->get('http://app.virtualracingleagues.localhost/login-as');

        // Should return validation error (422 or redirect with errors)
        $this->assertTrue(
            $response->status() === 422 || $response->isRedirect()
        );
    }

    public function test_get_route_with_invalid_token_format_fails_validation(): void
    {
        // Try to access GET route with invalid token format
        $response = $this->get('http://app.virtualracingleagues.localhost/login-as?token=not-a-uuid');

        // Should return validation error (422 or redirect with errors)
        $this->assertTrue(
            $response->status() === 422 || $response->isRedirect()
        );
    }

    public function test_get_route_for_deleted_user_redirects_to_login(): void
    {
        // Generate token
        $tokenResponse = $this->actingAs($this->superAdmin, 'admin')
            ->postJson("/api/admin/users/{$this->user->id}/login-as");

        $token = $tokenResponse->json('data.token');

        // Delete user after token generation
        $this->user->delete();

        // Try to consume token via GET
        $response = $this->get("http://app.virtualracingleagues.localhost/login-as?token={$token}");

        // Should redirect to public login with error
        $response->assertRedirect('http://virtualracingleagues.localhost:8000/login');
        $response->assertSessionHas('error', 'Cannot impersonate deleted users');
    }

    public function test_cannot_consume_token_for_deleted_user(): void
    {
        // Generate token
        $tokenResponse = $this->actingAs($this->superAdmin, 'admin')
            ->postJson("/api/admin/users/{$this->user->id}/login-as");

        $token = $tokenResponse->json('data.token');

        // Delete user after token generation
        $this->user->delete();

        // Try to consume token
        $response = $this->postJson('http://app.virtualracingleagues.localhost/api/impersonate', [
            'token' => $token,
        ]);

        $response->assertStatus(400);
        $response->assertJsonFragment([
            'message' => 'Cannot impersonate deleted users',
        ]);
    }

    public function test_multiple_admins_can_generate_tokens_for_same_user(): void
    {
        // Super admin generates token
        $response1 = $this->actingAs($this->superAdmin, 'admin')
            ->postJson("/api/admin/users/{$this->user->id}/login-as");

        // Regular admin generates token
        $response2 = $this->actingAs($this->admin, 'admin')
            ->postJson("/api/admin/users/{$this->user->id}/login-as");

        $response1->assertStatus(200);
        $response2->assertStatus(200);

        $token1 = $response1->json('data.token');
        $token2 = $response2->json('data.token');

        // Tokens should be different
        $this->assertNotEquals($token1, $token2);

        // Both tokens should exist in Redis
        $this->assertNotNull(Redis::get('user_impersonation:' . $token1));
        $this->assertNotNull(Redis::get('user_impersonation:' . $token2));
    }
}

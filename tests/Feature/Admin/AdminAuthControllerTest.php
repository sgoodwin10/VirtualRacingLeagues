<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminAuthControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_login_with_valid_credentials(): void
    {
        $admin = Admin::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
            'status' => 'active',
        ]);

        $response = $this->from('http://localhost:5173')
            ->withSession([])
            ->postJson('/api/admin/login', [
                'email' => 'test@example.com',
                'password' => 'password123',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Login successful.',
            ])
            ->assertJsonStructure([
                'data' => [
                    'admin' => ['id', 'first_name', 'last_name', 'name', 'email', 'role', 'status', 'last_login_at'],
                ],
            ]);

        $this->assertAuthenticated('admin');
    }

    public function test_admin_cannot_login_with_invalid_email(): void
    {
        $response = $this->withSession([])->postJson('/api/admin/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);

        $this->assertGuest('admin');
    }

    public function test_admin_cannot_login_with_invalid_password(): void
    {
        Admin::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('correctpassword'),
        ]);

        $response = $this->withSession([])->postJson('/api/admin/login', [
            'email' => 'test@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);

        $this->assertGuest('admin');
    }

    public function test_inactive_admin_cannot_login(): void
    {
        Admin::factory()->create([
            'email' => 'inactive@example.com',
            'password' => Hash::make('password123'),
            'status' => 'inactive',
        ]);

        $response = $this->withSession([])->postJson('/api/admin/login', [
            'email' => 'inactive@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);

        $this->assertGuest('admin');
    }

    public function test_login_validates_required_fields(): void
    {
        $response = $this->withSession([])->postJson('/api/admin/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_login_validates_email_format(): void
    {
        $response = $this->withSession([])->postJson('/api/admin/login', [
            'email' => 'not-an-email',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_login_updates_last_login_timestamp(): void
    {
        $admin = Admin::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
            'last_login_at' => null,
        ]);

        $this->assertNull($admin->last_login_at);

        $this->withSession([])->postJson('/api/admin/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $admin->refresh();
        $this->assertNotNull($admin->last_login_at);
    }

    public function test_authenticated_admin_can_logout(): void
    {
        $admin = Admin::factory()->create();

        $this->actingAs($admin, 'admin');
        $this->assertAuthenticated('admin');

        $response = $this->from('http://localhost:5173')
            ->withSession([])
            ->postJson('/api/admin/logout');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Logout successful.',
            ]);

        $this->assertGuest('admin');
    }

    public function test_check_returns_authenticated_for_logged_in_admin(): void
    {
        $admin = Admin::factory()->create(['status' => 'active']);

        $response = $this->actingAs($admin, 'admin')
            ->getJson('/api/admin/auth/check');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'authenticated' => true,
                ],
            ])
            ->assertJsonStructure([
                'data' => [
                    'admin' => ['id', 'first_name', 'last_name', 'email', 'role', 'status'],
                ],
            ]);
    }

    public function test_check_returns_unauthenticated_for_guest(): void
    {
        $response = $this->getJson('/api/admin/auth/check');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'authenticated' => false,
                ],
            ]);
    }

    public function test_check_returns_unauthenticated_for_inactive_admin(): void
    {
        $admin = Admin::factory()->create(['status' => 'inactive']);

        $response = $this->actingAs($admin, 'admin')
            ->getJson('/api/admin/auth/check');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'authenticated' => false,
                ],
            ]);
    }

    public function test_me_returns_current_admin_data(): void
    {
        $admin = Admin::factory()->create();

        $response = $this->actingAs($admin, 'admin')
            ->getJson('/api/admin/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'admin' => [
                        'id' => $admin->id,
                        'email' => $admin->email,
                    ],
                ],
            ]);
    }

    public function test_me_returns_401_for_unauthenticated_user(): void
    {
        $response = $this->getJson('/api/admin/auth/me');

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Unauthenticated.',
            ]);
    }

    public function test_profile_returns_current_admin_with_timestamps(): void
    {
        $admin = Admin::factory()->create();

        $response = $this->actingAs($admin, 'admin')
            ->getJson('/api/admin/profile');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'data' => [
                    'admin' => ['id', 'first_name', 'last_name', 'email', 'role', 'status', 'last_login_at', 'created_at'],
                ],
            ]);
    }

    public function test_profile_requires_authentication(): void
    {
        $response = $this->getJson('/api/admin/profile');

        $response->assertStatus(401);
    }

    public function test_admin_can_update_profile(): void
    {
        $admin = Admin::factory()->create([
            'first_name' => 'Original',
            'last_name' => 'Name',
            'email' => 'original@example.com',
        ]);

        $response = $this->actingAs($admin, 'admin')
            ->putJson('/api/admin/profile', [
                'first_name' => 'Updated',
                'last_name' => 'NewName',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Profile updated successfully.',
                'data' => [
                    'admin' => [
                        'first_name' => 'Updated',
                        'last_name' => 'NewName',
                    ],
                ],
            ]);

        $this->assertDatabaseHas('admins', [
            'id' => $admin->id,
            'first_name' => 'Updated',
            'last_name' => 'NewName',
        ]);
    }

    public function test_admin_can_update_email(): void
    {
        $admin = Admin::factory()->create(['email' => 'old@example.com']);

        $response = $this->actingAs($admin, 'admin')
            ->putJson('/api/admin/profile', [
                'email' => 'new@example.com',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('admins', [
            'id' => $admin->id,
            'email' => 'new@example.com',
        ]);
    }

    public function test_admin_can_update_password(): void
    {
        $admin = Admin::factory()->create([
            'password' => Hash::make('oldpassword'),
        ]);

        $response = $this->actingAs($admin, 'admin')
            ->putJson('/api/admin/profile', [
                'current_password' => 'oldpassword',
                'password' => 'newpassword123',
                'password_confirmation' => 'newpassword123',
            ]);

        $response->assertStatus(200);

        $admin->refresh();
        $this->assertTrue(Hash::check('newpassword123', $admin->password));
    }

    public function test_update_password_requires_current_password(): void
    {
        $admin = Admin::factory()->create([
            'password' => Hash::make('oldpassword'),
        ]);

        $response = $this->actingAs($admin, 'admin')
            ->putJson('/api/admin/profile', [
                'password' => 'newpassword123',
                'password_confirmation' => 'newpassword123',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);
    }

    public function test_update_password_validates_current_password(): void
    {
        $admin = Admin::factory()->create([
            'password' => Hash::make('correctpassword'),
        ]);

        $response = $this->actingAs($admin, 'admin')
            ->putJson('/api/admin/profile', [
                'current_password' => 'wrongpassword',
                'password' => 'newpassword123',
                'password_confirmation' => 'newpassword123',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);
    }

    public function test_update_password_requires_confirmation(): void
    {
        $admin = Admin::factory()->create([
            'password' => Hash::make('oldpassword'),
        ]);

        $response = $this->actingAs($admin, 'admin')
            ->putJson('/api/admin/profile', [
                'current_password' => 'oldpassword',
                'password' => 'newpassword123',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_update_profile_validates_email_uniqueness(): void
    {
        Admin::factory()->create(['email' => 'existing@example.com']);
        $admin = Admin::factory()->create(['email' => 'current@example.com']);

        $response = $this->actingAs($admin, 'admin')
            ->putJson('/api/admin/profile', [
                'email' => 'existing@example.com',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_update_profile_allows_keeping_same_email(): void
    {
        $admin = Admin::factory()->create(['email' => 'current@example.com']);

        $response = $this->actingAs($admin, 'admin')
            ->putJson('/api/admin/profile', [
                'email' => 'current@example.com',
                'first_name' => 'Updated',
            ]);

        $response->assertStatus(200);
    }

    public function test_inactive_admin_is_logged_out_when_accessing_protected_route(): void
    {
        $admin = Admin::factory()->create(['status' => 'active']);

        $this->actingAs($admin, 'admin');
        $this->assertAuthenticated('admin');

        // Change admin status to inactive
        $admin->update(['status' => 'inactive']);

        $response = $this->from('http://localhost:5173')
            ->withSession([])
            ->getJson('/api/admin/profile');

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Your account has been deactivated. Please contact support.',
            ]);
    }
}

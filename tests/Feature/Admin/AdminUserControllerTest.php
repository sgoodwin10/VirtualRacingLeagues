<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that moderators cannot access the admin user list endpoint.
     */
    public function test_moderators_cannot_list_admin_users(): void
    {
        $moderator = Admin::factory()->create(['role' => 'moderator']);

        $response = $this->actingAs($moderator, 'admin')
            ->getJson('/api/admin/admins');

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Forbidden. Moderators do not have access to admin user management.',
            ]);
    }

    /**
     * Test that super admins can list all admin users.
     */
    public function test_super_admin_can_list_all_admin_users(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);
        Admin::factory()->create(['role' => 'admin', 'first_name' => 'John', 'last_name' => 'Doe']);
        Admin::factory()->create(['role' => 'moderator', 'first_name' => 'Jane', 'last_name' => 'Smith']);

        $response = $this->actingAs($superAdmin, 'admin')
            ->getJson('/api/admin/admins');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'first_name',
                        'last_name',
                        'email',
                        'role',
                        'status',
                        'last_login_at',
                        'created_at',
                        'updated_at',
                    ],
                ],
                'meta',
                'links',
            ]);

        $this->assertCount(3, $response->json('data')); // super_admin + 2 others
    }

    /**
     * Test that admins can only list admin and moderator users.
     */
    public function test_admin_can_only_list_admin_and_moderator_users(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);
        Admin::factory()->create(['role' => 'super_admin']);
        $otherAdmin = Admin::factory()->create(['role' => 'admin']);
        $moderator = Admin::factory()->create(['role' => 'moderator']);

        $response = $this->actingAs($admin, 'admin')
            ->getJson('/api/admin/admins');

        $response->assertStatus(200);

        // Should only see admin and moderator users (not super_admin)
        // The requesting admin + 1 other admin + 1 moderator = 3 users
        $this->assertCount(3, $response->json('data'));

        // Verify no super_admin in the results
        $roles = array_column($response->json('data'), 'role');
        $this->assertNotContains('super_admin', $roles);
    }

    /**
     * Test search functionality.
     */
    public function test_can_search_admin_users(): void
    {
        $superAdmin = Admin::factory()->create([
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'role' => 'super_admin',
        ]);
        Admin::factory()->create(['first_name' => 'John', 'last_name' => 'Doe', 'role' => 'admin']);
        Admin::factory()->create(['first_name' => 'Jane', 'last_name' => 'Smith', 'role' => 'admin']);

        $response = $this->actingAs($superAdmin, 'admin')
            ->getJson('/api/admin/admins?search=John');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('John', $response->json('data.0.first_name'));
    }

    /**
     * Test status filter functionality.
     */
    public function test_can_filter_by_status(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);
        Admin::factory()->create(['status' => 'active', 'role' => 'admin']);
        Admin::factory()->create(['status' => 'inactive', 'role' => 'admin']);

        $response = $this->actingAs($superAdmin, 'admin')
            ->getJson('/api/admin/admins?status=active');

        $response->assertStatus(200);
        // Only active users (super_admin + 1 active admin)
        $this->assertCount(2, $response->json('data'));
    }

    /**
     * Test sorting functionality.
     */
    public function test_can_sort_admin_users(): void
    {
        $superAdmin = Admin::factory()->create(['first_name' => 'Zach', 'role' => 'super_admin']);
        Admin::factory()->create(['first_name' => 'Alice', 'role' => 'admin']);
        Admin::factory()->create(['first_name' => 'Charlie', 'role' => 'admin']);
        Admin::factory()->create(['first_name' => 'Bob', 'role' => 'admin']);

        $response = $this->actingAs($superAdmin, 'admin')
            ->getJson('/api/admin/admins?sort_by=first_name&sort_order=asc');

        $response->assertStatus(200);
        $firstNames = array_column($response->json('data'), 'first_name');
        $this->assertEquals('Alice', $firstNames[0]);
    }

    /**
     * Test pagination functionality.
     */
    public function test_can_paginate_admin_users(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);
        Admin::factory()->count(30)->create(['role' => 'admin']);

        $response = $this->actingAs($superAdmin, 'admin')
            ->getJson('/api/admin/admins?per_page=10');

        $response->assertStatus(200);
        $this->assertCount(10, $response->json('data'));
        $this->assertEquals(31, $response->json('meta.total'));
    }

    /**
     * Test that moderators cannot view a specific admin user.
     */
    public function test_moderators_cannot_show_admin_user(): void
    {
        $moderator = Admin::factory()->create(['role' => 'moderator']);
        $admin = Admin::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($moderator, 'admin')
            ->getJson("/api/admin/admins/{$admin->id}");

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Forbidden. Moderators do not have access to admin user management.',
            ]);
    }

    /**
     * Test that super admins can view any admin user.
     */
    public function test_super_admin_can_show_any_admin_user(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);
        $admin = Admin::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($superAdmin, 'admin')
            ->getJson("/api/admin/admins/{$admin->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $admin->id,
                    'first_name' => $admin->first_name,
                    'last_name' => $admin->last_name,
                    'email' => $admin->email,
                    'role' => 'admin',
                ],
            ]);
    }

    /**
     * Test that admins cannot view super admin users.
     */
    public function test_admin_cannot_show_super_admin_user(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);

        $response = $this->actingAs($admin, 'admin')
            ->getJson("/api/admin/admins/{$superAdmin->id}");

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Forbidden. You do not have permission to view this admin user.',
            ]);
    }

    /**
     * Test that admins can view other admin and moderator users.
     */
    public function test_admin_can_show_admin_and_moderator_users(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);
        $otherAdmin = Admin::factory()->create(['role' => 'admin']);
        $moderator = Admin::factory()->create(['role' => 'moderator']);

        $response1 = $this->actingAs($admin, 'admin')
            ->getJson("/api/admin/admins/{$otherAdmin->id}");

        $response1->assertStatus(200);

        $response2 = $this->actingAs($admin, 'admin')
            ->getJson("/api/admin/admins/{$moderator->id}");

        $response2->assertStatus(200);
    }

    /**
     * Test 404 for non-existent admin user.
     */
    public function test_show_returns_404_for_non_existent_user(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);

        $response = $this->actingAs($superAdmin, 'admin')
            ->getJson('/api/admin/admins/99999');

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Admin user not found.',
            ]);
    }

    /**
     * Test that moderators cannot update admin users.
     */
    public function test_moderators_cannot_update_admin_users(): void
    {
        $moderator = Admin::factory()->create(['role' => 'moderator']);
        $admin = Admin::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($moderator, 'admin')
            ->putJson("/api/admin/admins/{$admin->id}", [
                'first_name' => 'Updated',
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Forbidden. Moderators do not have access to admin user management.',
            ]);
    }

    /**
     * Test that super admins can update any admin user.
     */
    public function test_super_admin_can_update_any_admin_user(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);
        $admin = Admin::factory()->create(['role' => 'admin', 'first_name' => 'Original']);

        $response = $this->actingAs($superAdmin, 'admin')
            ->putJson("/api/admin/admins/{$admin->id}", [
                'first_name' => 'Updated',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Admin user updated successfully.',
                'data' => [
                    'first_name' => 'Updated',
                ],
            ]);

        $this->assertDatabaseHas('admins', [
            'id' => $admin->id,
            'first_name' => 'Updated',
        ]);
    }

    /**
     * Test that admins cannot update super admin users.
     */
    public function test_admin_cannot_update_super_admin_user(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);

        $response = $this->actingAs($admin, 'admin')
            ->putJson("/api/admin/admins/{$superAdmin->id}", [
                'first_name' => 'Updated',
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Forbidden. You do not have permission to update this admin user.',
            ]);
    }

    /**
     * Test that admins can update other admin and moderator users.
     */
    public function test_admin_can_update_admin_and_moderator_users(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);
        $otherAdmin = Admin::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin, 'admin')
            ->putJson("/api/admin/admins/{$otherAdmin->id}", [
                'first_name' => 'Updated',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('admins', [
            'id' => $otherAdmin->id,
            'first_name' => 'Updated',
        ]);
    }

    /**
     * Test that admins cannot assign super_admin role.
     */
    public function test_admin_cannot_assign_super_admin_role(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);
        $moderator = Admin::factory()->create(['role' => 'moderator']);

        $response = $this->actingAs($admin, 'admin')
            ->putJson("/api/admin/admins/{$moderator->id}", [
                'role' => 'super_admin',
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Forbidden. You do not have permission to assign this role.',
            ]);
    }

    /**
     * Test that super admins can assign any role.
     */
    public function test_super_admin_can_assign_any_role(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);
        $moderator = Admin::factory()->create(['role' => 'moderator']);

        $response = $this->actingAs($superAdmin, 'admin')
            ->putJson("/api/admin/admins/{$moderator->id}", [
                'role' => 'admin',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('admins', [
            'id' => $moderator->id,
            'role' => 'admin',
        ]);
    }

    /**
     * Test email validation on update.
     */
    public function test_update_validates_email_uniqueness(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);
        $admin1 = Admin::factory()->create(['email' => 'existing@example.com', 'role' => 'admin']);
        $admin2 = Admin::factory()->create(['email' => 'other@example.com', 'role' => 'admin']);

        $response = $this->actingAs($superAdmin, 'admin')
            ->putJson("/api/admin/admins/{$admin2->id}", [
                'email' => 'existing@example.com',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test that moderators cannot delete admin users.
     */
    public function test_moderators_cannot_delete_admin_users(): void
    {
        $moderator = Admin::factory()->create(['role' => 'moderator']);
        $admin = Admin::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($moderator, 'admin')
            ->deleteJson("/api/admin/admins/{$admin->id}");

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Forbidden. Moderators do not have access to admin user management.',
            ]);
    }

    /**
     * Test that super admins can delete any admin user.
     */
    public function test_super_admin_can_delete_any_admin_user(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);
        $admin = Admin::factory()->create(['role' => 'admin', 'status' => 'active']);

        $response = $this->actingAs($superAdmin, 'admin')
            ->deleteJson("/api/admin/admins/{$admin->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Admin user deleted successfully.',
            ]);

        // Check that the user is marked as inactive (soft delete)
        $this->assertDatabaseHas('admins', [
            'id' => $admin->id,
            'status' => 'inactive',
        ]);
    }

    /**
     * Test that admins cannot delete super admin users.
     */
    public function test_admin_cannot_delete_super_admin_user(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);

        $response = $this->actingAs($admin, 'admin')
            ->deleteJson("/api/admin/admins/{$superAdmin->id}");

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Forbidden. You do not have permission to delete this admin user.',
            ]);
    }

    /**
     * Test that admins can delete other admin and moderator users.
     */
    public function test_admin_can_delete_admin_and_moderator_users(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);
        $otherAdmin = Admin::factory()->create(['role' => 'admin', 'status' => 'active']);

        $response = $this->actingAs($admin, 'admin')
            ->deleteJson("/api/admin/admins/{$otherAdmin->id}");

        $response->assertStatus(200);

        $this->assertDatabaseHas('admins', [
            'id' => $otherAdmin->id,
            'status' => 'inactive',
        ]);
    }

    /**
     * Test that users cannot delete themselves.
     */
    public function test_cannot_delete_self(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);

        $response = $this->actingAs($superAdmin, 'admin')
            ->deleteJson("/api/admin/admins/{$superAdmin->id}");

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'You cannot delete your own account.',
            ]);
    }

    /**
     * Test 404 for deleting non-existent user.
     */
    public function test_delete_returns_404_for_non_existent_user(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);

        $response = $this->actingAs($superAdmin, 'admin')
            ->deleteJson('/api/admin/admins/99999');

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Admin user not found.',
            ]);
    }

    /**
     * Test that super admins can create super_admin users.
     */
    public function test_super_admin_can_create_super_admin_user(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);

        $response = $this->actingAs($superAdmin, 'admin')
            ->postJson('/api/admin/admins', [
                'first_name' => 'New',
                'last_name' => 'SuperAdmin',
                'email' => 'newsuperadmin@example.com',
                'role' => 'super_admin',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Admin user created successfully.',
                'data' => [
                    'first_name' => 'New',
                    'last_name' => 'SuperAdmin',
                    'email' => 'newsuperadmin@example.com',
                    'role' => 'super_admin',
                    'status' => 'active',
                ],
            ]);

        $this->assertDatabaseHas('admins', [
            'email' => 'newsuperadmin@example.com',
            'role' => 'super_admin',
            'status' => 'active',
        ]);
    }

    /**
     * Test that super admins can create admin users.
     */
    public function test_super_admin_can_create_admin_user(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);

        $response = $this->actingAs($superAdmin, 'admin')
            ->postJson('/api/admin/admins', [
                'first_name' => 'New',
                'last_name' => 'Admin',
                'email' => 'newadmin@example.com',
                'role' => 'admin',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Admin user created successfully.',
                'data' => [
                    'first_name' => 'New',
                    'last_name' => 'Admin',
                    'email' => 'newadmin@example.com',
                    'role' => 'admin',
                    'status' => 'active',
                ],
            ]);

        $this->assertDatabaseHas('admins', [
            'email' => 'newadmin@example.com',
            'role' => 'admin',
            'status' => 'active',
        ]);
    }

    /**
     * Test that super admins can create moderator users.
     */
    public function test_super_admin_can_create_moderator_user(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);

        $response = $this->actingAs($superAdmin, 'admin')
            ->postJson('/api/admin/admins', [
                'first_name' => 'New',
                'last_name' => 'Moderator',
                'email' => 'newmoderator@example.com',
                'role' => 'moderator',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Admin user created successfully.',
                'data' => [
                    'first_name' => 'New',
                    'last_name' => 'Moderator',
                    'email' => 'newmoderator@example.com',
                    'role' => 'moderator',
                    'status' => 'active',
                ],
            ]);

        $this->assertDatabaseHas('admins', [
            'email' => 'newmoderator@example.com',
            'role' => 'moderator',
            'status' => 'active',
        ]);
    }

    /**
     * Test that admins can create admin users.
     */
    public function test_admin_can_create_admin_user(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin, 'admin')
            ->postJson('/api/admin/admins', [
                'first_name' => 'New',
                'last_name' => 'Admin',
                'email' => 'newadmin2@example.com',
                'role' => 'admin',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Admin user created successfully.',
            ]);

        $this->assertDatabaseHas('admins', [
            'email' => 'newadmin2@example.com',
            'role' => 'admin',
        ]);
    }

    /**
     * Test that admins can create moderator users.
     */
    public function test_admin_can_create_moderator_user(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin, 'admin')
            ->postJson('/api/admin/admins', [
                'first_name' => 'New',
                'last_name' => 'Moderator',
                'email' => 'newmoderator2@example.com',
                'role' => 'moderator',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Admin user created successfully.',
            ]);

        $this->assertDatabaseHas('admins', [
            'email' => 'newmoderator2@example.com',
            'role' => 'moderator',
        ]);
    }

    /**
     * Test that admins cannot create super_admin users.
     */
    public function test_admin_cannot_create_super_admin_user(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin, 'admin')
            ->postJson('/api/admin/admins', [
                'first_name' => 'New',
                'last_name' => 'SuperAdmin',
                'email' => 'attemptsuper@example.com',
                'role' => 'super_admin',
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Forbidden. You do not have permission to create users with this role.',
                'errors' => [
                    'role' => ['You cannot create a user with a role higher than or equal to your own role.'],
                ],
            ]);

        $this->assertDatabaseMissing('admins', [
            'email' => 'attemptsuper@example.com',
        ]);
    }

    /**
     * Test that moderators cannot create any users.
     */
    public function test_moderator_cannot_create_users(): void
    {
        $moderator = Admin::factory()->create(['role' => 'moderator']);

        $response = $this->actingAs($moderator, 'admin')
            ->postJson('/api/admin/admins', [
                'first_name' => 'New',
                'last_name' => 'User',
                'email' => 'newuser@example.com',
                'role' => 'moderator',
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Forbidden. Moderators do not have permission to create admin users.',
            ]);

        $this->assertDatabaseMissing('admins', [
            'email' => 'newuser@example.com',
        ]);
    }

    /**
     * Test email uniqueness validation (case-insensitive).
     */
    public function test_store_validates_email_uniqueness_case_insensitive(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);
        Admin::factory()->create(['email' => 'existing@example.com']);

        // Try with exact match
        $response1 = $this->actingAs($superAdmin, 'admin')
            ->postJson('/api/admin/admins', [
                'first_name' => 'New',
                'last_name' => 'User',
                'email' => 'existing@example.com',
                'role' => 'admin',
            ]);

        $response1->assertStatus(422)
            ->assertJsonValidationErrors(['email']);

        // Try with different case
        $response2 = $this->actingAs($superAdmin, 'admin')
            ->postJson('/api/admin/admins', [
                'first_name' => 'New',
                'last_name' => 'User',
                'email' => 'EXISTING@EXAMPLE.COM',
                'role' => 'admin',
            ]);

        $response2->assertStatus(422)
            ->assertJsonValidationErrors(['email']);

        // Try with mixed case
        $response3 = $this->actingAs($superAdmin, 'admin')
            ->postJson('/api/admin/admins', [
                'first_name' => 'New',
                'last_name' => 'User',
                'email' => 'ExIsTiNg@ExAmPlE.cOm',
                'role' => 'admin',
            ]);

        $response3->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test required field validation.
     */
    public function test_store_validates_required_fields(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);

        $response = $this->actingAs($superAdmin, 'admin')
            ->postJson('/api/admin/admins', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['first_name', 'last_name', 'email', 'role']);
    }

    /**
     * Test first_name validation.
     */
    public function test_store_validates_first_name(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);

        // Test string max length
        $response = $this->actingAs($superAdmin, 'admin')
            ->postJson('/api/admin/admins', [
                'first_name' => str_repeat('a', 256),
                'last_name' => 'User',
                'email' => 'test@example.com',
                'role' => 'admin',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['first_name']);
    }

    /**
     * Test last_name validation.
     */
    public function test_store_validates_last_name(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);

        // Test string max length
        $response = $this->actingAs($superAdmin, 'admin')
            ->postJson('/api/admin/admins', [
                'first_name' => 'Test',
                'last_name' => str_repeat('a', 256),
                'email' => 'test@example.com',
                'role' => 'admin',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['last_name']);
    }

    /**
     * Test email format validation.
     */
    public function test_store_validates_email_format(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);

        $response = $this->actingAs($superAdmin, 'admin')
            ->postJson('/api/admin/admins', [
                'first_name' => 'Test',
                'last_name' => 'User',
                'email' => 'invalid-email',
                'role' => 'admin',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test invalid role validation.
     */
    public function test_store_validates_invalid_role(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);

        $response = $this->actingAs($superAdmin, 'admin')
            ->postJson('/api/admin/admins', [
                'first_name' => 'Test',
                'last_name' => 'User',
                'email' => 'test@example.com',
                'role' => 'invalid_role',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['role']);
    }

    /**
     * Test that created user has a password generated.
     */
    public function test_store_generates_password_for_new_user(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);

        $this->actingAs($superAdmin, 'admin')
            ->postJson('/api/admin/admins', [
                'first_name' => 'Test',
                'last_name' => 'User',
                'email' => 'testpassword@example.com',
                'role' => 'admin',
            ]);

        $createdAdmin = Admin::where('email', 'testpassword@example.com')->first();

        $this->assertNotNull($createdAdmin);
        $this->assertNotNull($createdAdmin->password);
        $this->assertNotEmpty($createdAdmin->password);
    }

    /**
     * Test that moderators cannot restore admin users.
     */
    public function test_moderators_cannot_restore_admin_users(): void
    {
        $moderator = Admin::factory()->create(['role' => 'moderator']);
        $admin = Admin::factory()->create(['role' => 'admin', 'status' => 'inactive']);

        $response = $this->actingAs($moderator, 'admin')
            ->postJson("/api/admin/admins/{$admin->id}/restore");

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Forbidden. Moderators do not have access to admin user management.',
            ]);
    }

    /**
     * Test that super admins can restore any admin user.
     */
    public function test_super_admin_can_restore_any_admin_user(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);
        $admin = Admin::factory()->create(['role' => 'admin', 'status' => 'inactive']);

        $response = $this->actingAs($superAdmin, 'admin')
            ->postJson("/api/admin/admins/{$admin->id}/restore");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Admin user restored successfully.',
                'data' => [
                    'id' => $admin->id,
                    'status' => 'active',
                ],
            ]);

        $this->assertDatabaseHas('admins', [
            'id' => $admin->id,
            'status' => 'active',
        ]);
    }

    /**
     * Test that admins cannot restore super admin users.
     */
    public function test_admin_cannot_restore_super_admin_user(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);
        $superAdmin = Admin::factory()->create(['role' => 'super_admin', 'status' => 'inactive']);

        $response = $this->actingAs($admin, 'admin')
            ->postJson("/api/admin/admins/{$superAdmin->id}/restore");

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Forbidden. You do not have permission to restore this admin user.',
            ]);
    }

    /**
     * Test that admins can restore other admin and moderator users.
     */
    public function test_admin_can_restore_admin_and_moderator_users(): void
    {
        $admin = Admin::factory()->create(['role' => 'admin']);
        $otherAdmin = Admin::factory()->create(['role' => 'admin', 'status' => 'inactive']);
        $moderator = Admin::factory()->create(['role' => 'moderator', 'status' => 'inactive']);

        $response1 = $this->actingAs($admin, 'admin')
            ->postJson("/api/admin/admins/{$otherAdmin->id}/restore");

        $response1->assertStatus(200);

        $this->assertDatabaseHas('admins', [
            'id' => $otherAdmin->id,
            'status' => 'active',
        ]);

        $response2 = $this->actingAs($admin, 'admin')
            ->postJson("/api/admin/admins/{$moderator->id}/restore");

        $response2->assertStatus(200);

        $this->assertDatabaseHas('admins', [
            'id' => $moderator->id,
            'status' => 'active',
        ]);
    }

    /**
     * Test that restoring an already active admin returns an error.
     */
    public function test_restore_returns_error_for_active_admin(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);
        $admin = Admin::factory()->create(['role' => 'admin', 'status' => 'active']);

        $response = $this->actingAs($superAdmin, 'admin')
            ->postJson("/api/admin/admins/{$admin->id}/restore");

        $response->assertStatus(400)
            ->assertJson([
                'message' => 'Admin user is already active.',
            ]);
    }

    /**
     * Test 404 for restoring non-existent admin user.
     */
    public function test_restore_returns_404_for_non_existent_user(): void
    {
        $superAdmin = Admin::factory()->create(['role' => 'super_admin']);

        $response = $this->actingAs($superAdmin, 'admin')
            ->postJson('/api/admin/admins/99999/restore');

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Admin user not found.',
            ]);
    }
}

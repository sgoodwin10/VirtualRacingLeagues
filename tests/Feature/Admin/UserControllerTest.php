<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Admin;
use App\Models\User;
use App\Notifications\EmailVerificationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Activitylog\Models\Activity;
use Tests\TestCase;

class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;

    protected function setUp(): void
    {
        parent::setUp();

        // Create an admin user for authentication
        $this->admin = Admin::factory()->create([
            'email' => 'admin@example.com',
            'role' => 'super_admin',
        ]);
    }

    public function test_can_list_users(): void
    {
        // Create test users
        User::factory()->count(3)->create();

        $response = $this->actingAs($this->admin, 'admin')
            ->getJson('/api/admin/users');

        $response->assertStatus(200);
        $response->assertJsonCount(3, 'data');
    }

    public function test_can_search_users_by_first_name(): void
    {
        User::factory()->create(['first_name' => 'John', 'last_name' => 'Doe']);
        User::factory()->create(['first_name' => 'Jane', 'last_name' => 'Smith']);

        $response = $this->actingAs($this->admin, 'admin')
            ->getJson('/api/admin/users?search=John');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonFragment(['first_name' => 'John']);
    }

    public function test_can_search_users_by_email(): void
    {
        User::factory()->create(['email' => 'john@example.com']);
        User::factory()->create(['email' => 'jane@example.com']);

        $response = $this->actingAs($this->admin, 'admin')
            ->getJson('/api/admin/users?search=john@example.com');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonFragment(['email' => 'john@example.com']);
    }

    public function test_can_filter_users_by_status(): void
    {
        User::factory()->create(['status' => 'active']);
        User::factory()->create(['status' => 'inactive']);
        User::factory()->create(['status' => 'suspended']);

        $response = $this->actingAs($this->admin, 'admin')
            ->getJson('/api/admin/users?status=active');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonFragment(['status' => 'active']);
    }

    public function test_can_include_soft_deleted_users(): void
    {
        $user = User::factory()->create();
        $user->delete();

        // Without include_deleted
        $response = $this->actingAs($this->admin, 'admin')
            ->getJson('/api/admin/users');

        $response->assertStatus(200);
        $response->assertJsonCount(0, 'data');

        // With include_deleted
        $response = $this->actingAs($this->admin, 'admin')
            ->getJson('/api/admin/users?include_deleted=1');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
    }

    public function test_can_get_single_user(): void
    {
        $user = User::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
        ]);

        $response = $this->actingAs($this->admin, 'admin')
            ->getJson("/api/admin/users/{$user->id}");

        $response->assertStatus(200);
        $response->assertJsonPath('data.user.first_name', 'John');
        $response->assertJsonPath('data.user.last_name', 'Doe');
        $response->assertJsonPath('data.user.email', 'john@example.com');
    }

    public function test_can_get_user_with_activity_logs(): void
    {
        $user = User::factory()->create();

        // Create some activity
        activity()
            ->causedBy($this->admin)
            ->performedOn($user)
            ->log('test activity');

        $response = $this->actingAs($this->admin, 'admin')
            ->getJson("/api/admin/users/{$user->id}");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'user' => [
                    'id',
                    'first_name',
                    'last_name',
                    'email',
                ],
                'activities' => [
                    '*' => [
                        'id',
                        'description',
                        'created_at',
                    ],
                ],
            ],
        ]);
    }

    public function test_can_create_user(): void
    {
        $userData = [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'alias' => 'johnd',
            'status' => 'active',
        ];

        $response = $this->actingAs($this->admin, 'admin')
            ->postJson('/api/admin/users', $userData);

        $response->assertStatus(201);
        $response->assertJsonFragment([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'alias' => 'johnd',
            'status' => 'active',
        ]);

        // Verify user exists in database
        $this->assertDatabaseHas('users', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
        ]);

        // Verify password is hashed
        $user = User::where('email', 'john@example.com')->first();
        $this->assertTrue(Hash::check('password123', $user->password));
    }

    public function test_cannot_create_user_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'john@example.com']);

        $userData = [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
        ];

        $response = $this->actingAs($this->admin, 'admin')
            ->postJson('/api/admin/users', $userData);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_cannot_create_user_with_short_password(): void
    {
        $userData = [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'password' => 'short',
        ];

        $response = $this->actingAs($this->admin, 'admin')
            ->postJson('/api/admin/users', $userData);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    public function test_create_user_logs_activity(): void
    {
        $this->markTestSkipped('Activity logging not yet implemented for admin user creation');

        $userData = [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
        ];

        $this->actingAs($this->admin, 'admin')
            ->postJson('/api/admin/users', $userData);

        // Verify activity log was created
        $this->assertDatabaseHas('activity_log', [
            'description' => 'created user',
            'causer_type' => Admin::class,
            'causer_id' => $this->admin->id,
            'subject_type' => User::class,
        ]);
    }

    public function test_can_update_user(): void
    {
        $user = User::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
        ]);

        $updateData = [
            'first_name' => 'Jane',
            'email' => 'jane@example.com',
        ];

        $response = $this->actingAs($this->admin, 'admin')
            ->putJson("/api/admin/users/{$user->id}", $updateData);

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'first_name' => 'Jane',
            'email' => 'jane@example.com',
        ]);

        // Verify database was updated
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'first_name' => 'Jane',
            'email' => 'jane@example.com',
        ]);
    }

    public function test_can_update_user_password(): void
    {
        $user = User::factory()->create();

        $updateData = [
            'password' => 'newpassword123',
        ];

        $response = $this->actingAs($this->admin, 'admin')
            ->putJson("/api/admin/users/{$user->id}", $updateData);

        $response->assertStatus(200);

        // Verify password was updated
        $user->refresh();
        $this->assertTrue(Hash::check('newpassword123', $user->password));
    }

    public function test_can_update_user_without_password(): void
    {
        $user = User::factory()->create(['password' => Hash::make('oldpassword')]);

        $updateData = [
            'first_name' => 'Updated',
        ];

        $response = $this->actingAs($this->admin, 'admin')
            ->putJson("/api/admin/users/{$user->id}", $updateData);

        $response->assertStatus(200);

        // Verify password was not changed
        $user->refresh();
        $this->assertTrue(Hash::check('oldpassword', $user->password));
    }

    public function test_cannot_update_user_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);
        $user = User::factory()->create(['email' => 'user@example.com']);

        $updateData = [
            'email' => 'existing@example.com',
        ];

        $response = $this->actingAs($this->admin, 'admin')
            ->putJson("/api/admin/users/{$user->id}", $updateData);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_update_user_logs_activity(): void
    {
        $this->markTestSkipped('Activity logging not yet implemented for admin user updates');

        $user = User::factory()->create([
            'first_name' => 'John',
            'status' => 'active',
        ]);

        $updateData = [
            'first_name' => 'Jane',
            'status' => 'inactive',
        ];

        $this->actingAs($this->admin, 'admin')
            ->putJson("/api/admin/users/{$user->id}", $updateData);

        // Verify activity log was created with old and new values
        $activity = Activity::where('description', 'updated user')
            ->where('subject_type', User::class)
            ->where('subject_id', $user->id)
            ->first();

        $this->assertNotNull($activity);
        $this->assertEquals($this->admin->id, $activity->causer_id);
        $this->assertEquals(Admin::class, $activity->causer_type);
    }

    public function test_can_delete_user(): void
    {
        $user = User::factory()->create(['status' => 'active']);

        $response = $this->actingAs($this->admin, 'admin')
            ->deleteJson("/api/admin/users/{$user->id}");

        $response->assertStatus(200);
        $response->assertJsonFragment(['message' => 'User deactivated successfully']);

        // Verify user is soft deleted
        $this->assertSoftDeleted('users', ['id' => $user->id]);

        // Verify status was changed to inactive
        $user->refresh();
        $this->assertEquals('inactive', $user->status);
    }

    public function test_delete_user_logs_activity(): void
    {
        $this->markTestSkipped('Activity logging not yet implemented for admin user deletion');

        $user = User::factory()->create();

        $this->actingAs($this->admin, 'admin')
            ->deleteJson("/api/admin/users/{$user->id}");

        // Verify activity log was created
        $this->assertDatabaseHas('activity_log', [
            'description' => 'deactivated user',
            'causer_type' => Admin::class,
            'causer_id' => $this->admin->id,
            'subject_type' => User::class,
            'subject_id' => $user->id,
        ]);
    }

    public function test_can_restore_user(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $user->delete();

        $response = $this->actingAs($this->admin, 'admin')
            ->postJson("/api/admin/users/{$user->id}/restore");

        $response->assertStatus(200);

        // Verify user is restored
        $user->refresh();
        $this->assertNull($user->deleted_at);
        $this->assertEquals('active', $user->status);
    }

    public function test_cannot_restore_non_deleted_user(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($this->admin, 'admin')
            ->postJson("/api/admin/users/{$user->id}/restore");

        $response->assertStatus(400);
        $response->assertJsonFragment(['message' => 'User is not deactivated']);
    }

    public function test_restore_user_logs_activity(): void
    {
        $this->markTestSkipped('Activity logging not yet implemented for admin user restoration');

        $user = User::factory()->create();
        $user->delete();

        $this->actingAs($this->admin, 'admin')
            ->postJson("/api/admin/users/{$user->id}/restore");

        // Verify activity log was created
        $this->assertDatabaseHas('activity_log', [
            'description' => 'reactivated user',
            'causer_type' => Admin::class,
            'causer_id' => $this->admin->id,
            'subject_type' => User::class,
            'subject_id' => $user->id,
        ]);
    }

    public function test_unauthorized_access_is_denied(): void
    {
        $response = $this->getJson('/api/admin/users');
        $response->assertStatus(401);
    }

    public function test_user_not_found_returns_404(): void
    {
        $response = $this->actingAs($this->admin, 'admin')
            ->getJson('/api/admin/users/99999');

        $response->assertStatus(404);
    }

    public function test_can_sort_users(): void
    {
        User::factory()->create(['first_name' => 'Charlie', 'created_at' => now()->subDays(2)]);
        User::factory()->create(['first_name' => 'Alice', 'created_at' => now()->subDays(1)]);
        User::factory()->create(['first_name' => 'Bob', 'created_at' => now()]);

        // Sort by first_name ascending
        $response = $this->actingAs($this->admin, 'admin')
            ->getJson('/api/admin/users?sort_field=first_name&sort_order=asc');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals('Alice', $data[0]['first_name']);
        $this->assertEquals('Bob', $data[1]['first_name']);
        $this->assertEquals('Charlie', $data[2]['first_name']);
    }

    public function test_create_user_defaults_status_to_active(): void
    {
        $userData = [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
        ];

        $response = $this->actingAs($this->admin, 'admin')
            ->postJson('/api/admin/users', $userData);

        $response->assertStatus(201);
        $response->assertJsonFragment(['status' => 'active']);
    }

    public function test_can_create_user_with_suspended_status(): void
    {
        $userData = [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'status' => 'suspended',
        ];

        $response = $this->actingAs($this->admin, 'admin')
            ->postJson('/api/admin/users', $userData);

        $response->assertStatus(201);
        $response->assertJsonFragment(['status' => 'suspended']);
    }

    public function test_can_manually_verify_user_email(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => null,
        ]);

        $this->assertNull($user->email_verified_at);

        $response = $this->actingAs($this->admin, 'admin')
            ->patchJson("/api/admin/users/{$user->id}/verify-email");

        $response->assertStatus(200);
        $response->assertJsonFragment(['message' => 'User email verified successfully']);

        // Verify email was marked as verified
        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
    }

    public function test_verify_email_is_idempotent(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $originalVerifiedAt = $user->email_verified_at;

        $response = $this->actingAs($this->admin, 'admin')
            ->patchJson("/api/admin/users/{$user->id}/verify-email");

        $response->assertStatus(200);

        // Verify timestamp was not changed
        $user->refresh();
        $this->assertEquals($originalVerifiedAt->timestamp, $user->email_verified_at->timestamp);
    }

    public function test_verify_email_returns_404_for_nonexistent_user(): void
    {
        $response = $this->actingAs($this->admin, 'admin')
            ->patchJson('/api/admin/users/99999/verify-email');

        $response->assertStatus(404);
    }

    public function test_verify_email_logs_activity(): void
    {
        $this->markTestSkipped('Activity logging not yet implemented for admin email verification');

        $user = User::factory()->create([
            'email_verified_at' => null,
        ]);

        $this->actingAs($this->admin, 'admin')
            ->patchJson("/api/admin/users/{$user->id}/verify-email");

        // Verify activity log was created
        $this->assertDatabaseHas('activity_log', [
            'description' => 'email verified',
            'subject_type' => User::class,
            'subject_id' => $user->id,
        ]);
    }

    public function test_can_resend_verification_email(): void
    {
        \Notification::fake();

        $user = User::factory()->create([
            'email_verified_at' => null,
        ]);

        $response = $this->actingAs($this->admin, 'admin')
            ->postJson("/api/admin/users/{$user->id}/resend-verification");

        $response->assertStatus(200);
        $response->assertJsonFragment(['message' => 'Verification email sent successfully']);

        // Verify notification was sent
        \Notification::assertSentTo(
            [$user],
            EmailVerificationNotification::class
        );
    }

    public function test_can_resend_verification_email_even_if_already_verified(): void
    {
        \Notification::fake();

        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($this->admin, 'admin')
            ->postJson("/api/admin/users/{$user->id}/resend-verification");

        $response->assertStatus(200);

        // Verify notification was sent even though already verified
        \Notification::assertSentTo(
            [$user],
            EmailVerificationNotification::class
        );
    }

    public function test_resend_verification_returns_404_for_nonexistent_user(): void
    {
        $response = $this->actingAs($this->admin, 'admin')
            ->postJson('/api/admin/users/99999/resend-verification');

        $response->assertStatus(404);
    }

    public function test_resend_verification_logs_activity(): void
    {
        $this->markTestSkipped('Activity logging not yet implemented for resend verification');

        \Notification::fake();

        $user = User::factory()->create([
            'email_verified_at' => null,
        ]);

        $this->actingAs($this->admin, 'admin')
            ->postJson("/api/admin/users/{$user->id}/resend-verification");

        // Verify activity log was created
        $this->assertDatabaseHas('activity_log', [
            'description' => 'email verification requested',
            'subject_type' => User::class,
            'subject_id' => $user->id,
        ]);
    }

    public function test_verify_email_requires_authentication(): void
    {
        $user = User::factory()->create();

        $response = $this->patchJson("/api/admin/users/{$user->id}/verify-email");

        $response->assertStatus(401);
    }

    public function test_resend_verification_requires_authentication(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson("/api/admin/users/{$user->id}/resend-verification");

        $response->assertStatus(401);
    }
}
